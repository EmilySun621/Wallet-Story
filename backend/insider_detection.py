"""
insider_detection.py — Statistical insider detection for WalletStory.

Core module: binomial significance testing on wallet win rates.
Determines whether a wallet's trading performance is statistically
incompatible with independent random betting.
"""

import json
import logging
from dataclasses import dataclass, asdict
from pathlib import Path

from scipy.stats import binomtest

log = logging.getLogger("insider_detection")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class InsiderReport:
    """Statistical summary for a single wallet."""
    address: str
    username: str
    total_trades: int
    wins: int
    losses: int
    skipped: int          # SELL trades or unresolved markets
    win_rate: float       # wins / (wins + losses)
    baseline: float       # null hypothesis probability
    p_value: float        # P(>= wins | H0: p == baseline)
    verdict: str          # Critical / High / Medium / Low
    total_usdc_volume: float
    markets_traded: int


# ---------------------------------------------------------------------------
# Core statistics
# ---------------------------------------------------------------------------

def compute_win_rate(classified_trades: list[dict]) -> tuple[int, int, int]:
    """
    From classified trades (output of data_fetcher.classify_trades),
    return (wins, losses, skipped).
    """
    wins = sum(1 for t in classified_trades if t.get("won") is True)
    losses = sum(1 for t in classified_trades if t.get("won") is False)
    skipped = sum(1 for t in classified_trades if t.get("won") is None)
    return wins, losses, skipped


def binomial_p_value(
    wins: int,
    total: int,
    baseline: float = 0.5,
) -> float:
    """
    P(observing >= `wins` successes out of `total` trials)
    under the null hypothesis that each trial has probability `baseline`.

    Uses scipy's exact binomial test (one-sided, greater).
    """
    if total == 0:
        return 1.0
    result = binomtest(wins, total, p=baseline, alternative="greater")
    return result.pvalue


def verdict_from_p(p: float) -> str:
    """Map p-value to a qualitative verdict."""
    if p < 1e-10:
        return "Critical"
    if p < 1e-5:
        return "High"
    if p < 1e-2:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Full wallet analysis
# ---------------------------------------------------------------------------

def analyze_wallet(
    address: str,
    username: str,
    classified_trades: list[dict],
    baseline: float = 0.5,
) -> InsiderReport:
    """
    Run the full insider detection pipeline on one wallet's classified trades.
    Returns an InsiderReport with statistical summary.
    """
    wins, losses, skipped = compute_win_rate(classified_trades)
    total_directional = wins + losses

    if total_directional > 0:
        win_rate = wins / total_directional
        p = binomial_p_value(wins, total_directional, baseline)
    else:
        win_rate = 0.0
        p = 1.0

    verdict = verdict_from_p(p)

    # Aggregate volume (USDC)
    total_volume = sum(t.get("usdcSize", 0) or 0 for t in classified_trades)

    # Unique markets
    markets = {t.get("slug", "") for t in classified_trades if t.get("slug")}

    report = InsiderReport(
        address=address,
        username=username,
        total_trades=len(classified_trades),
        wins=wins,
        losses=losses,
        skipped=skipped,
        win_rate=round(win_rate, 6),
        baseline=baseline,
        p_value=p,
        verdict=verdict,
        total_usdc_volume=round(total_volume, 2),
        markets_traded=len(markets),
    )

    log.info(
        "%s: %d/%d wins (%.1f%%), p=%.2e → %s",
        username, wins, total_directional,
        win_rate * 100, p, verdict,
    )

    return report


def analyze_cluster(
    wallets: list[dict],
    all_classified: dict[str, list[dict]],
    baseline: float = 0.5,
) -> dict:
    """
    Run insider detection on a cluster of wallets.
    Returns aggregate statistics and per-wallet reports.

    Args:
        wallets: list of {"address": "0x...", "username": "..."}
        all_classified: {address: classified_trades} from data_fetcher
        baseline: null hypothesis win probability
    """
    reports = []
    agg_wins = 0
    agg_losses = 0
    agg_volume = 0.0

    for w in wallets:
        addr = w["address"].lower()
        uname = w.get("username", addr[:10])
        trades = all_classified.get(addr, [])
        report = analyze_wallet(addr, uname, trades, baseline)
        reports.append(report)
        agg_wins += report.wins
        agg_losses += report.losses
        agg_volume += report.total_usdc_volume

    agg_total = agg_wins + agg_losses
    agg_win_rate = agg_wins / agg_total if agg_total > 0 else 0.0
    agg_p = binomial_p_value(agg_wins, agg_total, baseline)
    agg_verdict = verdict_from_p(agg_p)

    log.info(
        "CLUSTER AGGREGATE: %d/%d wins (%.1f%%), p=%.2e → %s",
        agg_wins, agg_total, agg_win_rate * 100, agg_p, agg_verdict,
    )

    return {
        "cluster_name": "Polymarket Theo Cluster",
        "wallets_analyzed": len(wallets),
        "aggregate": {
            "total_trades": agg_total,
            "wins": agg_wins,
            "losses": agg_losses,
            "win_rate": round(agg_win_rate, 6),
            "baseline": baseline,
            "p_value": agg_p,
            "p_value_scientific": f"{agg_p:.2e}",
            "verdict": agg_verdict,
            "total_usdc_volume": round(agg_volume, 2),
        },
        "per_wallet": [asdict(r) for r in reports],
    }


# ===================================================================
# Timing Analysis: Pre-Resolution Loading Signal
# ===================================================================

def fetch_market_lifecycles(market_slugs_or_ids):
    """
    Query Polymarket Gamma API for each market's open/close timestamps.

    Args:
        market_slugs_or_ids: list of market slugs or condition IDs

    Returns:
        dict: market_id -> {'open_ts': unix, 'close_ts': unix, 'slug': str}

    Uses Gamma API endpoint: https://gamma-api.polymarket.com/markets?slug=<slug>
    Fields: startDate, endDate, createdAt

    Fallback: if startDate missing, use first trade timestamp
    If endDate missing, skip market with warning
    """
    import requests
    from datetime import datetime

    lifecycles = {}

    for item in market_slugs_or_ids:
        try:
            # Try slug first
            url = f"https://gamma-api.polymarket.com/markets?slug={item}"
            resp = requests.get(url, timeout=10)

            if resp.status_code != 200:
                # Try as condition_id
                url = f"https://gamma-api.polymarket.com/markets?condition_id={item}"
                resp = requests.get(url, timeout=10)

            if resp.status_code != 200:
                log.warning(f"Failed to fetch lifecycle for {item}: {resp.status_code}")
                continue

            data = resp.json()
            if not data:
                log.warning(f"No market data for {item}")
                continue

            market = data[0] if isinstance(data, list) else data

            # Extract timestamps
            start_date = market.get('startDate') or market.get('createdAt')
            end_date = market.get('endDate') or market.get('resolvedAt')

            if not start_date:
                log.warning(f"Market {item}: missing startDate, will use first trade timestamp")
                start_ts = None
            else:
                start_ts = _parse_timestamp(start_date)

            if not end_date:
                log.warning(f"Market {item}: missing endDate, skipping")
                continue

            close_ts = _parse_timestamp(end_date)

            market_id = market.get('condition_id') or market.get('id') or item

            lifecycles[market_id] = {
                'open_ts': start_ts,
                'close_ts': close_ts,
                'slug': market.get('slug', item)
            }

        except Exception as e:
            log.error(f"Error fetching lifecycle for {item}: {e}")
            continue

    return lifecycles


def _parse_timestamp(date_str):
    """Parse ISO timestamp or unix timestamp to unix seconds."""
    if isinstance(date_str, (int, float)):
        return int(date_str)

    try:
        from dateutil import parser
        dt = parser.parse(date_str)
        return int(dt.timestamp())
    except:
        # Fallback: try parsing as ISO
        from datetime import datetime
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return int(dt.timestamp())


def compute_timing_distribution(trades, market_lifecycles, side_filter="BUY"):
    """
    For each trade of the given side, compute normalized time in [0, 1]:

        frac = (trade_ts - open_ts) / (close_ts - open_ts)

    Args:
        trades: list of trade dicts with 'timestamp', 'side', 'market_id'/'slug'
        market_lifecycles: dict from fetch_market_lifecycles
        side_filter: "BUY" (default) for entry trades only

    Returns:
        list of floats in [0, 1], clipped to valid range

    Skips trades with missing lifecycle or invalid timing
    """
    timings = []

    for trade in trades:
        # Filter by side
        if side_filter and trade.get('side') != side_filter:
            continue

        # Get market lifecycle
        market_id = trade.get('condition_id') or trade.get('market_id') or trade.get('slug')
        if not market_id or market_id not in market_lifecycles:
            continue

        lifecycle = market_lifecycles[market_id]
        open_ts = lifecycle['open_ts']
        close_ts = lifecycle['close_ts']

        # Handle missing open_ts: use first trade timestamp as fallback
        trade_ts = trade.get('timestamp')
        if not trade_ts:
            continue

        if not open_ts:
            open_ts = trade_ts  # First trade = market open

        duration = close_ts - open_ts
        if duration <= 0:
            continue

        # Compute normalized timing
        frac = (trade_ts - open_ts) / duration

        # Data quality guard: clip to [-0.05, 1.05]
        if frac < -0.05 or frac > 1.05:
            log.warning(f"Trade timing outside valid range: {frac:.3f}, skipping")
            continue

        # Clip to [0, 1]
        frac = max(0.0, min(1.0, frac))
        timings.append(frac)

    return timings


def pre_resolution_load_share(timings, threshold=0.9):
    """
    Fraction of trades in final (1-threshold) portion of market lifetime.

    Args:
        timings: list of floats in [0, 1] from compute_timing_distribution
        threshold: default 0.9 means "final 10% of market lifecycle"

    Returns:
        float: fraction of trades with timing >= threshold
    """
    if not timings:
        return 0.0

    late_trades = sum(1 for t in timings if t >= threshold)
    return late_trades / len(timings)


def volume_weighted_entry_time(trades_with_timings):
    """
    Volume-weighted median timing value.

    Args:
        trades_with_timings: list of {'timing': float, 'size_usd': float}

    Returns:
        float: volume-weighted median timing
    """
    import numpy as np

    if not trades_with_timings:
        return 0.5

    # Sort by timing
    sorted_trades = sorted(trades_with_timings, key=lambda x: x['timing'])

    # Compute cumulative volume
    total_volume = sum(t['size_usd'] for t in sorted_trades)
    if total_volume == 0:
        # Unweighted median fallback
        timings = [t['timing'] for t in trades_with_timings]
        return float(np.median(timings))

    cumsum = 0
    target = total_volume / 2

    for trade in sorted_trades:
        cumsum += trade['size_usd']
        if cumsum >= target:
            return trade['timing']

    return sorted_trades[-1]['timing']


def timing_ks_test_vs_uniform(timings):
    """
    Kolmogorov-Smirnov test against uniform distribution.

    Args:
        timings: list of floats in [0, 1]

    Returns:
        dict: {'ks_statistic': float, 'p_value': float, 'n': int}
        or None if n < 20 (insufficient data)
    """
    from scipy.stats import kstest

    if len(timings) < 20:
        log.warning(f"Only {len(timings)} timing samples, skipping KS test (need >=20)")
        return None

    result = kstest(timings, 'uniform')

    return {
        'ks_statistic': float(result.statistic),
        'p_value': float(result.pvalue),
        'n': len(timings)
    }


def timing_ks_test_2sample(timings_a, timings_b):
    """
    Two-sample Kolmogorov-Smirnov test.

    For comparing insider cluster vs control.

    Args:
        timings_a: list of floats (e.g., insider cluster)
        timings_b: list of floats (e.g., control)

    Returns:
        dict: {'ks_statistic': float, 'p_value': float}
    """
    from scipy.stats import ks_2samp

    result = ks_2samp(timings_a, timings_b)

    return {
        'ks_statistic': float(result.statistic),
        'p_value': float(result.pvalue),
        'n_a': len(timings_a),
        'n_b': len(timings_b)
    }


def verdict_adjustment_from_timing(ks_p_value, load_share):
    """
    Optional: boost verdict by one level if timing is strongly suspicious.

    Args:
        ks_p_value: p-value from KS test vs uniform
        load_share: fraction in final 10% of market lifecycle

    Returns:
        'boost' if ks_p_value < 1e-10 AND load_share > 0.5
        'neutral' otherwise
    """
    if ks_p_value < 1e-10 and load_share > 0.5:
        return 'boost'
    return 'neutral'


# ===================================================================
# CLI smoke test
# ===================================================================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")

    from data_fetcher import fetch_polymarket_trades, classify_trades

    case_path = Path(__file__).resolve().parent / "data" / "case_polymarket_theo.json"
    with open(case_path) as f:
        case = json.load(f)

    verified = [a for a in case["addresses"] if a.get("verified")]
    print(f"\n=== Insider Detection: {len(verified)} wallets ===\n")

    all_classified = {}
    for w in verified:
        addr = w["address"].lower()
        print(f"Fetching trades for {w['username']}...")
        trades = fetch_polymarket_trades(addr, max_pages=10)
        classified = classify_trades(trades)
        all_classified[addr] = classified

    result = analyze_cluster(verified, all_classified, baseline=0.5)

    print(f"\n=== CLUSTER RESULT ===")
    print(f"Wallets: {result['wallets_analyzed']}")
    print(f"Aggregate: {result['aggregate']['wins']}/{result['aggregate']['total_trades']} "
          f"({result['aggregate']['win_rate']*100:.1f}%)")
    print(f"p-value: {result['aggregate']['p_value_scientific']}")
    print(f"Verdict: {result['aggregate']['verdict']}")

    print(f"\nPer-wallet:")
    for r in result["per_wallet"]:
        print(f"  {r['username']}: {r['wins']}/{r['wins']+r['losses']} "
              f"({r['win_rate']*100:.1f}%) p={r['p_value']:.2e} → {r['verdict']}")
