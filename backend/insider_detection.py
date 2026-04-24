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
            "p_value_scientific": "< 1e-300" if (agg_p == 0 or agg_p < 1e-300) else f"{agg_p:.2e}",
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


def derive_market_lifecycles_from_trades(all_trades):
    """
    Fallback: derive market lifecycles from trade timestamps.

    For archived markets where Gamma API doesn't return lifecycle metadata,
    we can approximate:
      - open_ts = earliest trade timestamp for that market
      - close_ts = latest trade timestamp for that market

    Args:
        all_trades: dict {wallet_addr: [trade_dicts]} or list of trade dicts

    Returns:
        dict: market_id -> {'open_ts': unix, 'close_ts': unix, 'slug': str, 'source': 'derived'}

    Quality guard: require at least 10 trades per market to compute lifecycle.
    """
    # Flatten trades if dict
    if isinstance(all_trades, dict):
        flat_trades = []
        for trades in all_trades.values():
            flat_trades.extend(trades)
    else:
        flat_trades = all_trades

    # Group trades by market
    markets_trades = {}
    for t in flat_trades:
        market_id = t.get('condition_id') or t.get('market_id') or t.get('slug')
        if not market_id:
            continue
        if market_id not in markets_trades:
            markets_trades[market_id] = []
        markets_trades[market_id].append(t)

    # Derive lifecycles
    lifecycles = {}
    for market_id, trades in markets_trades.items():
        # Quality guard: require at least 10 trades
        if len(trades) < 10:
            log.debug(f"Market {market_id}: only {len(trades)} trades, skipping lifecycle derivation (need >=10)")
            continue

        # Extract timestamps
        timestamps = []
        for t in trades:
            ts = t.get('timestamp')
            if ts:
                timestamps.append(ts)

        if len(timestamps) < 10:
            continue

        open_ts = min(timestamps)
        close_ts = max(timestamps)

        # Sanity check: close > open
        if close_ts <= open_ts:
            log.warning(f"Market {market_id}: close_ts <= open_ts, skipping")
            continue

        lifecycles[market_id] = {
            'open_ts': open_ts,
            'close_ts': close_ts,
            'slug': market_id,
            'source': 'derived'
        }
        log.debug(f"Derived lifecycle for {market_id}: {len(trades)} trades, span={(close_ts-open_ts)/(86400):.1f} days")

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
# Pairwise Temporal Alignment Signal
# ===================================================================

def pairwise_alignment_score(trades_a, trades_b, kernel_seconds=86400):
    """
    Temporal similarity between two wallets' trade timestamps.

    Linear kernel: same hour = 1.0, 24h apart = 0.0.
    For each trade in A, find the closest trade in B, compute
    kernel value, then average. Returns float in [0, 1].

    Args:
        trades_a: list of trade dicts with 'timestamp' field
        trades_b: list of trade dicts with 'timestamp' field
        kernel_seconds: kernel bandwidth (default 86400 = 24 hours)

    Returns:
        float in [0, 1]: mean similarity across all trades in A
    """
    import numpy as np

    # Extract timestamps
    ts_a = [t.get('timestamp') for t in trades_a if t.get('timestamp')]
    ts_b = [t.get('timestamp') for t in trades_b if t.get('timestamp')]

    if not ts_a or not ts_b:
        return 0.0

    ts_a = np.array(sorted(ts_a))
    ts_b = np.array(sorted(ts_b))

    # For each trade in A, find closest trade in B
    similarities = []
    for t_a in ts_a:
        # Compute distance to all trades in B
        distances = np.abs(ts_b - t_a)
        min_distance = np.min(distances)

        # Linear kernel: similarity = max(0, 1 - distance/bandwidth)
        similarity = max(0.0, 1.0 - min_distance / kernel_seconds)
        similarities.append(similarity)

    return float(np.mean(similarities))


def compute_pairwise_alignment_matrix(wallet_trades_dict, kernel_seconds=86400):
    """
    Returns (addresses_list, N x N list-of-lists matrix).
    Diagonal is 1.0.

    Args:
        wallet_trades_dict: {address: [trade_dicts]}
        kernel_seconds: kernel bandwidth

    Returns:
        tuple: (addresses_list, matrix)
            - addresses_list: sorted list of wallet addresses
            - matrix: N x N list of lists, matrix[i][j] = alignment score
    """
    addresses = sorted(wallet_trades_dict.keys())
    n = len(addresses)

    # Initialize matrix
    matrix = [[0.0 for _ in range(n)] for _ in range(n)]

    # Compute pairwise scores
    for i, addr_a in enumerate(addresses):
        for j, addr_b in enumerate(addresses):
            if i == j:
                matrix[i][j] = 1.0
            elif i < j:
                # Compute score once, mirror it
                score = pairwise_alignment_score(
                    wallet_trades_dict[addr_a],
                    wallet_trades_dict[addr_b],
                    kernel_seconds
                )
                matrix[i][j] = score
                matrix[j][i] = score
            # else: already filled by mirroring

    return addresses, matrix


def alignment_null_distribution(wallet_trades_dict, n_simulations=100, kernel_seconds=86400):
    """
    For each sim: uniformly redistribute timestamps within each
    wallet's observed time range (preserving count), recompute
    pairwise alignment, record mean off-diagonal.
    Returns list of null means.

    Args:
        wallet_trades_dict: {address: [trade_dicts]}
        n_simulations: number of Monte Carlo simulations
        kernel_seconds: kernel bandwidth

    Returns:
        list of floats: mean off-diagonal alignment for each simulation
    """
    import numpy as np

    # Extract time ranges for each wallet
    wallet_ranges = {}
    for addr, trades in wallet_trades_dict.items():
        timestamps = [t.get('timestamp') for t in trades if t.get('timestamp')]
        if timestamps:
            wallet_ranges[addr] = {
                'min': min(timestamps),
                'max': max(timestamps),
                'count': len(timestamps)
            }

    null_means = []

    for _ in range(n_simulations):
        # Shuffle timestamps for each wallet
        shuffled_trades = {}
        for addr, info in wallet_ranges.items():
            # Generate uniform random timestamps in wallet's time range
            random_ts = np.random.uniform(
                info['min'],
                info['max'],
                size=info['count']
            )
            shuffled_trades[addr] = [{'timestamp': int(ts)} for ts in random_ts]

        # Compute pairwise alignment matrix
        _, matrix = compute_pairwise_alignment_matrix(shuffled_trades, kernel_seconds)

        # Compute mean off-diagonal
        n = len(matrix)
        off_diagonal_sum = 0.0
        off_diagonal_count = 0
        for i in range(n):
            for j in range(n):
                if i != j:
                    off_diagonal_sum += matrix[i][j]
                    off_diagonal_count += 1

        if off_diagonal_count > 0:
            null_means.append(off_diagonal_sum / off_diagonal_count)

    return null_means


def test_alignment_significance(observed_matrix, null_distribution):
    """
    Returns dict: observed_mean, null_mean, null_std, z_score,
    p_value (one-tailed via scipy.stats.norm).

    Args:
        observed_matrix: N x N list of lists from compute_pairwise_alignment_matrix
        null_distribution: list of null means from alignment_null_distribution

    Returns:
        dict with statistical test results
    """
    import numpy as np
    from scipy.stats import norm

    # Compute observed mean off-diagonal
    n = len(observed_matrix)
    off_diagonal_sum = 0.0
    off_diagonal_count = 0
    for i in range(n):
        for j in range(n):
            if i != j:
                off_diagonal_sum += observed_matrix[i][j]
                off_diagonal_count += 1

    observed_mean = off_diagonal_sum / off_diagonal_count if off_diagonal_count > 0 else 0.0

    # Null distribution statistics
    null_mean = float(np.mean(null_distribution))
    null_std = float(np.std(null_distribution, ddof=1))

    # Z-score and p-value
    if null_std > 0:
        z_score = (observed_mean - null_mean) / null_std
        # One-tailed test: P(Z > z_score)
        p_value = 1 - norm.cdf(z_score)
    else:
        z_score = 0.0
        p_value = 1.0

    return {
        'observed_mean': float(observed_mean),
        'null_mean': null_mean,
        'null_std': null_std,
        'z_score': float(z_score),
        'p_value': float(p_value)
    }


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
        p_val = r['p_value']
        p_str = "< 1e-300" if (p_val == 0 or p_val < 1e-300) else f"{p_val:.2e}"
        print(f"  {r['username']}: {r['wins']}/{r['wins']+r['losses']} "
              f"({r['win_rate']*100:.1f}%) p={p_str} → {r['verdict']}")
