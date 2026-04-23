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
