#!/usr/bin/env python3
"""
Watchlist Builder — Overnight batch task to pre-cache top Polymarket trader analysis

Usage:
    python backend/build_watchlist.py

Output:
    backend/data/cached_watchlist.json
"""

import json
import time
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

# Polymarket Data API endpoint
POLYMARKET_API = "https://data-api.polymarket.com"

# Known wallets to always include
THEO_SEED_WALLETS = [
    "0x1f2dd6d473f3e824cd2f8a89d9c69fb96f6ad0cf",  # Fredi9999
    "0x56687bf447db6ffa42ffe2204a05edaa20f55839",  # Theo4
    "0x8119010a6e589062aa03583bb3f39ca632d9f887",  # PrincessCaro
]

CONTROL_WALLET = "0x0000000000000000000000000000000000000000"  # Replace with actual control

# Rate limiting and retry config
MAX_RETRIES = 3
INITIAL_BACKOFF = 2  # seconds
MAX_BACKOFF = 60  # seconds
MAX_RUNTIME_HOURS = 3
MIN_RESULTS = 15


def exponential_backoff(attempt: int) -> int:
    """Calculate exponential backoff delay"""
    delay = min(INITIAL_BACKOFF * (2 ** attempt), MAX_BACKOFF)
    return delay


def fetch_with_retry(url: str, retries: int = MAX_RETRIES) -> Optional[dict]:
    """Fetch JSON from URL with exponential backoff retry logic"""
    import requests

    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit
                delay = exponential_backoff(attempt)
                print(f"⏳ Rate limited. Retrying in {delay}s... (attempt {attempt + 1}/{retries})")
                time.sleep(delay)
            else:
                print(f"❌ HTTP {response.status_code}: {url}")
                return None
        except requests.RequestException as e:
            delay = exponential_backoff(attempt)
            print(f"❌ Request failed: {e}. Retrying in {delay}s... (attempt {attempt + 1}/{retries})")
            time.sleep(delay)

    print(f"❌ Failed after {retries} attempts: {url}")
    return None


def fetch_top_traders(target_count: int = 30) -> List[Dict]:
    """
    Fetch top Polymarket traders with mixed distribution:
    - Top 10 by volume (whales)
    - Mid-rank 10 (rank 50-100)
    - 10 high-activity low-volume (>200 trades, <$500K volume)

    Returns list of {address, username, volume, trades}
    """
    print(f"🔍 Fetching top {target_count} Polymarket traders...")

    # Try to fetch from Polymarket API
    # Note: This may not work - Polymarket API structure may vary
    traders = []

    try:
        # Attempt to fetch leaderboard data
        url = f"{POLYMARKET_API}/leaderboard"
        data = fetch_with_retry(url)

        if data:
            # Parse response (adjust based on actual API schema)
            # Expected structure: list of {user, address, volume, ...}
            if isinstance(data, list):
                traders = data[:target_count]
            elif isinstance(data, dict) and 'data' in data:
                traders = data['data'][:target_count]
            else:
                print(f"⚠️ Unexpected API response structure: {type(data)}")
    except Exception as e:
        print(f"⚠️ Failed to fetch from Polymarket API: {e}")

    if traders:
        print(f"✓ Fetched {len(traders)} traders from API")
    else:
        print("⚠️ No traders fetched from API - will only analyze known wallets")

    return traders


def run_pipeline_on_address(address: str) -> Optional[Dict]:
    """
    Run InvestigatorAgent on a single address

    Returns extracted metrics or None if failed/insufficient data
    """
    print(f"🔬 Analyzing {address[:12]}...")

    try:
        # Import locally to avoid startup overhead
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from investigator_agent import InvestigatorAgent

        # Run investigation
        agent = InvestigatorAgent()
        report = agent.investigate(seed_address=address, max_iterations=15)

        # Extract required fields
        insider_detection = report.get('insider_detection', {})
        cluster_summary = report.get('cluster_summary', {})

        trade_count = insider_detection.get('total_trades', 0)

        # Skip if insufficient data
        if trade_count < 50:
            print(f"  ⏭️  Skipped (only {trade_count} trades)")
            return None

        # Extract metrics
        metrics = {
            'address': address,
            'username': None,  # Would need to add username extraction to agent
            'win_rate': insider_detection.get('win_rate', 0),
            'p_value': insider_detection.get('p_value', 1.0),
            'p_value_scientific': insider_detection.get('p_value_scientific', 'N/A'),
            'verdict': insider_detection.get('verdict', 'Unknown'),
            'trade_count': trade_count,
            'volume_usd': report.get('total_usdc_volume', 0),
            'cluster_size': cluster_summary.get('cluster_size', 1),
            'cached_at': datetime.utcnow().isoformat() + 'Z'
        }

        print(f"  ✓ {metrics['verdict']} | {trade_count} trades | p={metrics['p_value_scientific']}")
        return metrics

    except Exception as e:
        print(f"  ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def build_watchlist(max_runtime_hours: float = MAX_RUNTIME_HOURS) -> List[Dict]:
    """
    Main watchlist builder loop

    Returns sorted list of analyzed wallets (most critical first)
    """
    start_time = time.time()
    max_runtime_seconds = max_runtime_hours * 3600

    results = []

    # 1. Fetch top traders from Polymarket
    traders = fetch_top_traders(target_count=30)

    # 2. Add known Theo seeds (always include these)
    print(f"\n📌 Adding {len(THEO_SEED_WALLETS)} Theo seed wallets...")
    all_addresses = THEO_SEED_WALLETS.copy()

    # Add trader addresses if available
    if traders:
        trader_addresses = [
            t.get('address', t.get('wallet', t.get('user')))
            for t in traders
            if t.get('address') or t.get('wallet') or t.get('user')
        ]
        all_addresses.extend(trader_addresses)
        print(f"✓ Added {len(trader_addresses)} trader addresses from API")

    # Deduplicate and lowercase
    all_addresses = list(set(addr.lower() if addr else None for addr in all_addresses if addr))
    print(f"📋 Total addresses to analyze: {len(all_addresses)}")

    # 3. Run pipeline on each address
    print(f"\n🚀 Starting pipeline analysis (max {max_runtime_hours}h runtime)...\n")

    for idx, address in enumerate(all_addresses, 1):
        # Check runtime
        elapsed = time.time() - start_time
        if elapsed > max_runtime_seconds:
            print(f"\n⏰ Max runtime ({max_runtime_hours}h) reached. Stopping.")
            break

        print(f"[{idx}/{len(all_addresses)}] ", end="")

        metrics = run_pipeline_on_address(address)

        if metrics:
            results.append(metrics)

        # Small delay to avoid hammering the system
        time.sleep(1)

    # 4. Sort by verdict severity (Critical → High → Medium → Low → Baseline)
    severity_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Baseline': 4, 'Unknown': 5}
    results.sort(key=lambda x: (severity_order.get(x['verdict'], 6), x['p_value']))

    return results


def save_watchlist(results: List[Dict], output_path: Path):
    """Save results to cached_watchlist.json"""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Saved {len(results)} wallets to {output_path}")


def print_distribution_summary(results: List[Dict]):
    """Print verdict distribution summary"""
    from collections import Counter

    verdicts = Counter(r['verdict'] for r in results)

    print("\n📊 Verdict Distribution:")
    for verdict in ['Critical', 'High', 'Medium', 'Low', 'Baseline', 'Unknown']:
        count = verdicts.get(verdict, 0)
        print(f"  {verdict:10s}: {count}")

    # Check if meets expected distribution
    critical_count = verdicts.get('Critical', 0)
    high_medium_count = verdicts.get('High', 0) + verdicts.get('Medium', 0)

    print(f"\n🎯 Target Distribution Check:")
    print(f"  Critical: {critical_count} (target: 1-3)")
    print(f"  High+Medium: {high_medium_count} (target: 3-5)")
    print(f"  Total: {len(results)} (minimum: {MIN_RESULTS})")


def main():
    """Main entry point"""
    print("=" * 80)
    print("WalletStory Watchlist Builder — Overnight Batch Task")
    print("=" * 80)
    print()

    # Build watchlist
    results = build_watchlist(max_runtime_hours=MAX_RUNTIME_HOURS)

    # Check minimum results
    if len(results) < MIN_RESULTS:
        print(f"\n⚠️ WARNING: Only {len(results)} results collected (minimum: {MIN_RESULTS})")
        print("Saving partial results to PROGRESS.md")

        progress_path = Path("backend/PROGRESS.md")
        with open(progress_path, 'w') as f:
            f.write(f"# Watchlist Builder Progress\n\n")
            f.write(f"**Status**: Incomplete\n")
            f.write(f"**Results Collected**: {len(results)}/{MIN_RESULTS} minimum\n")
            f.write(f"**Timestamp**: {datetime.utcnow().isoformat()}Z\n\n")
            f.write("## Partial Results\n\n```json\n")
            json.dump(results, f, indent=2)
            f.write("\n```\n")

        print(f"✓ Progress saved to {progress_path}")

    # Save results
    output_path = Path("backend/data/cached_watchlist.json")
    save_watchlist(results, output_path)

    # Print summary
    print_distribution_summary(results)

    print("\n✅ Watchlist builder complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
