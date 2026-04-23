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
from insider_detection import analyze_cluster
from clustering import (
    build_graph,
    build_cotrade_graph,
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

    # ---- 4. Clustering ----
    log.info("=" * 60)
    log.info("STEP 4: Cluster analysis")
    log.info("=" * 60)

    alchemy_key = os.getenv("ALCHEMY_API_KEY", "")
    polygonscan_key = os.getenv("POLYGONSCAN_API_KEY", "")

    cluster_result = None
    transfer_cluster = None

    # Strategy 1: Transfer graph (if API key available)
    if alchemy_key or polygonscan_key:
        log.info("Building 2-hop transfer graph from Polygon...")
        all_edges = []
        for addr in seed_addrs:
            edges = fetch_counterparties(addr, max_hops=2, tx_limit_per_hop=500)
            all_edges.extend(edges)
        if all_edges:
            transfer_graph = build_graph(all_edges)
            transfer_cluster = analyze_theo_cluster(
                seed_addrs, transfer_graph, "transfer"
            )
            cluster_result = transfer_cluster
    else:
        log.info("No Alchemy/Polygonscan key — skipping transfer graph")

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
                "Co-trade graph built from 3 seed wallets only. "
                "Transfer graph (Alchemy) needed for 2-hop neighbor "
                "discovery and candidate Michie wallet surfacing."
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
    print(f"\nOutput: {out_path}")


if __name__ == "__main__":
    main()
