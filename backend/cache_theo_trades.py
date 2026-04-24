"""
cache_theo_trades.py — One-shot script to cache raw Polymarket trade timestamps.

Fetches and caches raw Polymarket trade timestamps for all 12 Theo cluster wallets.
Output: backend/data/theo_cluster_trades_cached.json

This allows the Colab reproducibility notebook to run pairwise alignment analysis
without requiring ALCHEMY_API_KEY or ANTHROPIC_API_KEY.
"""

import json
from pathlib import Path
from datetime import datetime, timezone

# Local imports
from data_fetcher import fetch_polymarket_trades, classify_trades

CASE_FILE = Path(__file__).parent / "data" / "case_polymarket_theo.json"
OUTPUT = Path(__file__).parent / "data" / "theo_cluster_trades_cached.json"


def main():
    # Load case file
    with open(CASE_FILE) as f:
        case = json.load(f)

    # Get all addresses
    seed_addresses = [a["address"] for a in case["addresses"]]
    candidate_addresses = [c["address"] for c in case.get("candidate_wallets_surfaced", [])]
    all_addresses = seed_addresses + candidate_addresses

    print(f"Fetching trades for {len(all_addresses)} wallets...")

    # Fetch trades for each wallet
    trades_by_wallet = {}
    for addr in all_addresses:
        print(f"  Fetching {addr[:10]}...")
        raw = fetch_polymarket_trades(addr, max_pages=10)
        classified = classify_trades(raw)

        # Keep only fields needed for analysis
        trades_by_wallet[addr] = [
            {
                "timestamp": t.get("timestamp"),
                "market": t.get("slug", ""),
                "won": t.get("won"),
                "side": t.get("side", ""),
            }
            for t in classified
            if t.get("timestamp") is not None
        ]
        print(f"    → {len(trades_by_wallet[addr])} trades with timestamps")

    # Build output
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "description": "Cached trade timestamps for Theo cluster pairwise alignment analysis",
        "seed_addresses": seed_addresses,
        "all_cluster_addresses": all_addresses,
        "trades": trades_by_wallet,
    }

    # Write to file
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2)

    # Report
    total = sum(len(t) for t in trades_by_wallet.values())
    file_size_kb = OUTPUT.stat().st_size / 1024

    print(f"\n✓ Saved {total} trades across {len(all_addresses)} wallets")
    print(f"✓ Output: {OUTPUT}")
    print(f"✓ File size: {file_size_kb:.1f} KB")

    if file_size_kb > 10240:  # 10 MB
        print(f"⚠️  Warning: File is large ({file_size_kb/1024:.1f} MB), consider reducing max_pages")


if __name__ == "__main__":
    main()
