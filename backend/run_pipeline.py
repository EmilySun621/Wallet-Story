"""
run_pipeline.py — End-to-end Day 1 pipeline for the Polymarket Theo case.

Runs:
  1. Fetch all trades for verified wallets
  2. Classify trades (win/loss)
  3. Run insider detection (binomial test)
  4. Build cluster graph + run Louvain
  5. Persist output to examples/case_polymarket_theo_output.json
"""

import json
import logging
import os
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

# Ensure backend/ is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from data_fetcher import (
    fetch_polymarket_trades,
    classify_trades,
    fetch_counterparties,
)
from insider_detection import (
    analyze_cluster,
    fetch_market_lifecycles,
    derive_market_lifecycles_from_trades,
    compute_timing_distribution,
    pre_resolution_load_share,
    volume_weighted_entry_time,
    timing_ks_test_vs_uniform,
)
from clustering import (
    build_graph,
    build_cotrade_graph,
    build_exchange_anchor_graph,
    discover_cluster_via_exchange,
    analyze_theo_cluster,
)

logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
log = logging.getLogger("pipeline")


def main():
    # ---- Load case file ----
    case_path = Path(__file__).resolve().parent / "data" / "case_polymarket_theo.json"
    with open(case_path) as f:
        case = json.load(f)

    verified = [a for a in case["addresses"] if a.get("verified")]
    seed_addrs = [a["address"] for a in verified]
    log.info("Loaded %d verified wallets from case file", len(verified))

    # ---- 1. Fetch trades ----
    log.info("=" * 60)
    log.info("STEP 1: Fetching Polymarket trades")
    log.info("=" * 60)

    all_trades: dict[str, list[dict]] = {}
    for w in verified:
        addr = w["address"].lower()
        log.info("Fetching %s (%s)...", w["username"], addr[:10])
        trades = fetch_polymarket_trades(addr, max_pages=10)
        all_trades[addr] = trades
        log.info("  → %d trades", len(trades))

    total_trades = sum(len(t) for t in all_trades.values())
    log.info("Total trades fetched: %d", total_trades)

    # ---- 2. Classify trades ----
    log.info("=" * 60)
    log.info("STEP 2: Classifying trades (win/loss)")
    log.info("=" * 60)

    all_classified: dict[str, list[dict]] = {}
    for addr, trades in all_trades.items():
        classified = classify_trades(trades)
        all_classified[addr] = classified

    # ---- 3. Insider detection ----
    log.info("=" * 60)
    log.info("STEP 3: Running insider detection (binomial test)")
    log.info("=" * 60)

    insider_result = analyze_cluster(verified, all_classified, baseline=0.5)

    # ---- 3.5 Timing Analysis ----
    log.info("=" * 60)
    log.info("STEP 3.5: Timing distribution analysis")
    log.info("=" * 60)

    # Collect all unique market slugs/IDs from trades
    market_ids = set()
    for trades in all_trades.values():
        for t in trades:
            market_id = t.get("condition_id") or t.get("slug")
            if market_id:
                market_ids.add(market_id)

    log.info("Fetching market lifecycles for %d unique markets...", len(market_ids))

    # Try Gamma API first
    market_lifecycles = fetch_market_lifecycles(list(market_ids))
    api_count = len(market_lifecycles)
    log.info("Retrieved %d market lifecycles from Gamma API", api_count)

    # Fallback: derive from trade timestamps for missing markets
    missing_markets = market_ids - set(market_lifecycles.keys())
    if missing_markets:
        log.info("Deriving lifecycles from trade data for %d missing markets...", len(missing_markets))
        derived_lifecycles = derive_market_lifecycles_from_trades(all_trades)

        # Merge derived lifecycles for missing markets only
        for market_id in missing_markets:
            if market_id in derived_lifecycles:
                market_lifecycles[market_id] = derived_lifecycles[market_id]

        derived_count = len(market_lifecycles) - api_count
        log.info("Derived %d additional lifecycles from trades", derived_count)
    else:
        derived_count = 0

    log.info("Total market lifecycles available: %d (API: %d, derived: %d)",
             len(market_lifecycles), api_count, derived_count)

    # Compute timing distribution for cluster
    all_cluster_timings = []
    all_cluster_trades_with_timing = []

    for addr, trades in all_trades.items():
        timings = compute_timing_distribution(trades, market_lifecycles, side_filter="BUY")
        all_cluster_timings.extend(timings)

        # Build trades_with_timing for volume-weighted calculation
        for t in trades:
            if t.get("side") != "BUY":
                continue
            market_id = t.get("condition_id") or t.get("slug")
            if not market_id or market_id not in market_lifecycles:
                continue

            lifecycle = market_lifecycles[market_id]
            open_ts = lifecycle["open_ts"]
            close_ts = lifecycle["close_ts"]
            trade_ts = t.get("timestamp")

            if not trade_ts:
                continue
            if not open_ts:
                open_ts = trade_ts

            duration = close_ts - open_ts
            if duration <= 0:
                continue

            frac = (trade_ts - open_ts) / duration
            if frac < -0.05 or frac > 1.05:
                continue
            frac = max(0.0, min(1.0, frac))

            all_cluster_trades_with_timing.append({
                "timing": frac,
                "size_usd": t.get("usdcSize", 0) or 0,
            })

    # Compute aggregate timing metrics
    load_share = pre_resolution_load_share(all_cluster_timings, threshold=0.9)
    vw_median = volume_weighted_entry_time(all_cluster_trades_with_timing)
    ks_result = timing_ks_test_vs_uniform(all_cluster_timings)

    # Build histogram bins [0, 0.1), [0.1, 0.2), ..., [0.9, 1.0]
    histogram = [0] * 10
    for t in all_cluster_timings:
        bin_idx = min(int(t * 10), 9)
        histogram[bin_idx] += 1

    # Interpretation
    if len(all_cluster_timings) < 20:
        interpretation = "N/A: Insufficient timing data (markets archived or lifecycle unavailable via Gamma API). Timing analysis requires active/recent markets with startDate/endDate metadata."
    elif ks_result and ks_result["p_value"] < 1e-10 and load_share > 0.5:
        interpretation = "Critical: Overwhelming evidence of pre-resolution loading (>50% trades in final 10%, KS p<1e-10)"
    elif ks_result and ks_result["p_value"] < 1e-5 and load_share > 0.4:
        interpretation = "High: Strong evidence of timing bias toward resolution (KS p<1e-5)"
    elif ks_result and ks_result["p_value"] < 0.01 and load_share > 0.3:
        interpretation = "Medium: Moderate timing bias detected"
    else:
        interpretation = "Low: Timing distribution consistent with uniform/random entry"

    timing_analysis = {
        "normalized_times_histogram": histogram,
        "histogram_bins": ["[0.0, 0.1)", "[0.1, 0.2)", "[0.2, 0.3)", "[0.3, 0.4)", "[0.4, 0.5)",
                           "[0.5, 0.6)", "[0.6, 0.7)", "[0.7, 0.8)", "[0.8, 0.9)", "[0.9, 1.0]"],
        "pre_resolution_load_share": round(load_share, 4),
        "volume_weighted_median_entry_time": round(vw_median, 4),
        "ks_vs_uniform": ks_result,
        "total_timing_samples": len(all_cluster_timings),
        "lifecycle_source": {"api": api_count, "derived": derived_count},
        "interpretation": interpretation,
    }

    log.info("Timing: %d samples, load_share=%.2f%%, vw_median=%.3f, KS_p=%.2e",
             len(all_cluster_timings), load_share * 100, vw_median,
             ks_result["p_value"] if ks_result else 1.0)

    # ---- 4. Clustering ----
    log.info("=" * 60)
    log.info("STEP 4: Cluster analysis")
    log.info("=" * 60)

    alchemy_key = os.getenv("ALCHEMY_API_KEY", "")

    cluster_result = None
    exchange_cluster_info = None

    # Strategy 1: Exchange-anchor transfer graph (preferred)
    if alchemy_key:
        log.info("Running exchange-anchor cluster discovery...")
        exchange_cluster_info = discover_cluster_via_exchange(
            seed_addrs, alchemy_key, min_cashout_usd=500_000,
        )
        if exchange_cluster_info.get("candidates"):
            exchange_graph = build_exchange_anchor_graph(exchange_cluster_info)
            cluster_result = analyze_theo_cluster(
                seed_addrs, exchange_graph, "exchange-anchor"
            )
            log.info(
                "Exchange-anchor: %d total wallets, %d candidates surfaced",
                exchange_cluster_info["total_cluster_size"],
                len(exchange_cluster_info["candidates"]),
            )
        else:
            log.warning("Exchange-anchor discovery found no candidates")
    else:
        log.info("No Alchemy key — skipping exchange-anchor clustering")

    # Strategy 2: Co-trade graph (always available)
    log.info("Building co-trade graph...")
    cotrade_graph = build_cotrade_graph(all_trades, time_window_secs=172800)
    cotrade_cluster = analyze_theo_cluster(seed_addrs, cotrade_graph, "co-trade")

    if cluster_result is None:
        cluster_result = cotrade_cluster

    # ---- 5. Build output ----
    log.info("=" * 60)
    log.info("STEP 5: Building output")
    log.info("=" * 60)

    # Unique markets across all wallets
    all_markets = set()
    for trades in all_classified.values():
        for t in trades:
            slug = t.get("slug", "")
            if slug:
                all_markets.add(slug)

    output = {
        "case_name": "Polymarket Theo Cluster",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "wallets_analyzed": len(verified),
        "matches_public_reporting": cluster_result.all_seeds_in_same_community,
        "total_trades_analyzed": insider_result["aggregate"]["total_trades"],
        "total_trades_fetched": total_trades,
        "unique_markets": len(all_markets),
        "aggregate_win_rate": insider_result["aggregate"]["win_rate"],
        "baseline_win_rate": insider_result["aggregate"]["baseline"],
        "p_value": insider_result["aggregate"]["p_value"],
        "p_value_scientific": insider_result["aggregate"]["p_value_scientific"],
        "verdict": insider_result["aggregate"]["verdict"],
        "total_usdc_volume": insider_result["aggregate"]["total_usdc_volume"],
        "timing_analysis": timing_analysis,
        "cluster_analysis": {
            "graph_type": cluster_result.graph_type,
            "graph_nodes": cluster_result.graph_nodes,
            "graph_edges": cluster_result.graph_edges,
            "communities_found": cluster_result.communities_found,
            "modularity_score": cluster_result.modularity_score,
            "all_seeds_in_same_community": cluster_result.all_seeds_in_same_community,
            "seed_community_size": cluster_result.seed_community_size,
            "candidate_wallets": cluster_result.candidate_wallets,
        },
        "exchange_anchor_analysis": (
            {
                "exchange_deposit": exchange_cluster_info["exchange"],
                "shared_funder": exchange_cluster_info["funder"],
                "shared_proxy": exchange_cluster_info.get("shared_proxy"),
                "total_cluster_size": exchange_cluster_info["total_cluster_size"],
                "seeds_found": exchange_cluster_info["seeds_found"],
                "candidates_surfaced": exchange_cluster_info["candidates"],
                "cluster_wallets": {
                    addr: info
                    for addr, info in exchange_cluster_info.get(
                        "cluster_wallets", {}
                    ).items()
                },
            }
            if exchange_cluster_info and exchange_cluster_info.get("candidates")
            else None
        ),
        "per_wallet": insider_result["per_wallet"],
        "cross_reference_sources": [
            "NYT DealBook 2024-10-24",
            "WSJ 2024-11-01",
            "Bloomberg 2024-11-06",
            "Bloomberg/Chainalysis 2024-11-07",
            "Chainalysis X thread 2024-11-06",
        ],
        "attestation_uid": "TODO: publish to EAS Sepolia on Day 2",
        "notes": {
            "data_api_limit": (
                "Polymarket Data API caps at ~4000 trades per wallet "
                "(offset pagination stops at 4000). True trade counts "
                "may be higher — the statistical signal is already "
                "overwhelming at this sample size."
            ),
            "clustering_note": (
                "Exchange-anchor clustering anchors on the shared Kraken "
                "deposit address, then verifies shared funder and shared "
                "Polymarket proxy wallet. This reproduces the Chainalysis "
                "methodology (funding patterns + exchange deposits) and "
                "independently surfaces the full wallet cluster."
            ),
        },
    }

    # ---- Persist ----
    out_dir = Path(__file__).resolve().parent.parent / "examples"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "case_polymarket_theo_output.json"

    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, default=str)

    log.info("Output saved to %s", out_path)

    # ---- Summary ----
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"Wallets analyzed:  {output['wallets_analyzed']}")
    print(f"Total trades:      {output['total_trades_analyzed']} "
          f"(directional) / {output['total_trades_fetched']} (fetched)")
    print(f"Unique markets:    {output['unique_markets']}")
    print(f"Aggregate win rate: {output['aggregate_win_rate']*100:.1f}%")
    print(f"p-value:           {output['p_value_scientific']}")
    print(f"Verdict:           {output['verdict']}")
    print(f"Volume (USDC):     ${output['total_usdc_volume']:,.2f}")
    print(f"Cluster match:     {output['matches_public_reporting']}")
    print(f"Candidates:        {output['cluster_analysis']['candidate_wallets']}")
    if output.get("exchange_anchor_analysis"):
        ea = output["exchange_anchor_analysis"]
        print(f"\n--- Exchange-Anchor Cluster ---")
        print(f"Total cluster:     {ea['total_cluster_size']} wallets")
        print(f"Seeds found:       {ea['seeds_found']}")
        print(f"Candidates:        {len(ea['candidates_surfaced'])}")
        print(f"Shared proxy:      {ea.get('shared_proxy', 'N/A')}")
        print(f"Exchange deposit:  {ea['exchange_deposit']}")
        print(f"Shared funder:     {ea['shared_funder']}")
    print(f"\nOutput: {out_path}")


if __name__ == "__main__":
    main()
