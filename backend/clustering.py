"""
clustering.py — Louvain community detection for WalletStory.

Two graph construction strategies:
  1. On-chain transfer graph (requires Alchemy/Polygonscan API key)
     - Edges = token transfers between wallets, weighted by value
     - 2-hop crawl from seed addresses
  2. Polymarket co-trading graph (no API key required)
     - Edges = wallets that traded the same markets within a time window
     - Weighted by number of co-traded markets and timing proximity

Strategy 1 is preferred (stronger signal for "coordinated wallets").
Strategy 2 is a fallback that still produces valid clusters.
"""

import json
import logging
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path

import networkx as nx
from networkx.algorithms.community import louvain_communities

log = logging.getLogger("clustering")


# ===================================================================
# Graph construction
# ===================================================================

def build_graph(edges: list[tuple[str, str, float]]) -> nx.Graph:
    """
    Build a weighted undirected graph from (src, dst, value) edges.
    Multiple edges between the same pair are aggregated (weight summed).
    """
    g = nx.Graph()
    for src, dst, val in edges:
        src, dst = src.lower(), dst.lower()
        if src == dst:
            continue
        if g.has_edge(src, dst):
            g[src][dst]["weight"] += val
        else:
            g.add_edge(src, dst, weight=val)
    return g


def build_cotrade_graph(
    all_trades: dict[str, list[dict]],
    time_window_secs: int = 172800,  # 48 hours
) -> nx.Graph:
    """
    Build a co-trading graph from Polymarket trade data.

    Two wallets share an edge if they traded the same market
    within `time_window_secs` of each other. Edge weight = number
    of co-traded (market, time_window) pairs.

    Args:
        all_trades: {address: [trade_dicts]} for all wallets in scope
        time_window_secs: maximum time gap for co-trading (default 48h)
    """
    # Index: market_slug -> [(address, timestamp)]
    market_participants: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for addr, trades in all_trades.items():
        addr = addr.lower()
        for t in trades:
            slug = t.get("slug", "")
            ts = t.get("timestamp", 0)
            if slug and ts:
                market_participants[slug].append((addr, ts))

    # For each market, create edges between wallets that traded within window
    edge_counts: dict[tuple[str, str], int] = defaultdict(int)
    for slug, participants in market_participants.items():
        participants.sort(key=lambda x: x[1])
        for i, (addr_i, ts_i) in enumerate(participants):
            for j in range(i + 1, len(participants)):
                addr_j, ts_j = participants[j]
                if ts_j - ts_i > time_window_secs:
                    break
                if addr_i != addr_j:
                    pair = tuple(sorted([addr_i, addr_j]))
                    edge_counts[pair] += 1

    # Build graph
    edges = [(a, b, float(w)) for (a, b), w in edge_counts.items()]
    g = build_graph(edges)
    log.info(
        "Co-trade graph: %d nodes, %d edges, %d unique markets",
        g.number_of_nodes(), g.number_of_edges(), len(market_participants),
    )
    return g


# ===================================================================
# Community detection
# ===================================================================

def find_clusters(g: nx.Graph, resolution: float = 1.0) -> list[set[str]]:
    """
    Run Louvain community detection on graph g.
    Returns list of communities (each a set of addresses).
    """
    if g.number_of_nodes() == 0:
        return []
    communities = louvain_communities(g, weight="weight", resolution=resolution, seed=42)
    log.info("Louvain found %d communities", len(communities))
    return [set(c) for c in communities]


def modularity(g: nx.Graph, communities: list[set]) -> float:
    """Compute modularity of the partition."""
    if not communities or g.number_of_edges() == 0:
        return 0.0
    return nx.algorithms.community.modularity(g, communities, weight="weight")


# ===================================================================
# Cluster analysis for the Theo case
# ===================================================================

@dataclass
class ClusterResult:
    """Result of cluster analysis on the Theo case."""
    seed_wallets: list[str]
    graph_nodes: int
    graph_edges: int
    communities_found: int
    modularity_score: float
    seed_community_id: int          # which community contains the seeds
    seed_community_size: int
    seed_community_members: list[str]
    all_seeds_in_same_community: bool
    candidate_wallets: list[str]    # non-seed wallets in the same community
    graph_type: str                 # "transfer" or "co-trade"


def analyze_theo_cluster(
    seed_addresses: list[str],
    graph: nx.Graph,
    graph_type: str = "transfer",
) -> ClusterResult:
    """
    Run Louvain on the graph and check whether the seed addresses
    (known Theo wallets) land in the same community.

    If they do, any additional wallets in that community are flagged
    as candidate_wallets (potential Michie or other cluster members).
    """
    seeds = {a.lower() for a in seed_addresses}
    communities = find_clusters(graph)
    mod = modularity(graph, communities)

    # Find which community contains the seed wallets
    seed_community_id = -1
    seed_community: set[str] = set()
    all_in_same = False

    for i, comm in enumerate(communities):
        overlap = seeds & comm
        if overlap:
            if seed_community_id == -1:
                seed_community_id = i
                seed_community = comm
            elif len(overlap) > len(seeds & seed_community):
                seed_community_id = i
                seed_community = comm

    seeds_in_community = seeds & seed_community
    all_in_same = (seeds_in_community == seeds)

    # Candidates: non-seed wallets in the same community as seeds
    candidates = sorted(seed_community - seeds)

    log.info(
        "Seeds in community %d: %d/%d | Community size: %d | "
        "Candidates: %d | Modularity: %.4f",
        seed_community_id, len(seeds_in_community), len(seeds),
        len(seed_community), len(candidates), mod,
    )

    if all_in_same:
        log.info(
            "ALL seed wallets landed in the same Louvain community — "
            "matches public reporting."
        )
    else:
        log.warning(
            "Seed wallets split across communities. Seeds found: %s",
            seeds_in_community,
        )

    return ClusterResult(
        seed_wallets=sorted(seeds),
        graph_nodes=graph.number_of_nodes(),
        graph_edges=graph.number_of_edges(),
        communities_found=len(communities),
        modularity_score=round(mod, 6),
        seed_community_id=seed_community_id,
        seed_community_size=len(seed_community),
        seed_community_members=sorted(seed_community),
        all_seeds_in_same_community=all_in_same,
        candidate_wallets=candidates,
        graph_type=graph_type,
    )


# ===================================================================
# CLI smoke test
# ===================================================================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")

    from data_fetcher import fetch_polymarket_trades, fetch_polygon_transfers
    import os

    case_path = Path(__file__).resolve().parent / "data" / "case_polymarket_theo.json"
    with open(case_path) as f:
        case = json.load(f)

    verified = [a for a in case["addresses"] if a.get("verified")]
    seed_addrs = [a["address"] for a in verified]
    print(f"\n=== Clustering: {len(verified)} seed wallets ===\n")

    # ---------- Strategy 1: on-chain transfers (if API key available) ----------
    alchemy_key = os.getenv("ALCHEMY_API_KEY", "")
    polygonscan_key = os.getenv("POLYGONSCAN_API_KEY", "")

    if alchemy_key or polygonscan_key:
        print("Building transfer graph (2-hop)...")
        from data_fetcher import fetch_counterparties
        all_edges = []
        for addr in seed_addrs:
            edges = fetch_counterparties(addr, max_hops=2, tx_limit_per_hop=300)
            all_edges.extend(edges)
        transfer_graph = build_graph(all_edges)
        result = analyze_theo_cluster(seed_addrs, transfer_graph, "transfer")
        print(f"\nTransfer graph result:")
        print(json.dumps(asdict(result), indent=2, default=str))
    else:
        print("[skip] No Alchemy/Polygonscan key — transfer graph unavailable\n")

    # ---------- Strategy 2: co-trading graph (always available) ----------
    print("Building co-trade graph...")
    all_trades = {}
    for w in verified:
        addr = w["address"].lower()
        print(f"  Fetching trades for {w['username']}...")
        trades = fetch_polymarket_trades(addr, max_pages=10)
        all_trades[addr] = trades

    cotrade_graph = build_cotrade_graph(all_trades, time_window_secs=172800)
    result = analyze_theo_cluster(seed_addrs, cotrade_graph, "co-trade")

    print(f"\nCo-trade graph result:")
    print(json.dumps(asdict(result), indent=2, default=str))

    if result.candidate_wallets:
        print(f"\n*** CANDIDATE WALLETS (potential Michie): ***")
        for c in result.candidate_wallets:
            print(f"  {c}")
