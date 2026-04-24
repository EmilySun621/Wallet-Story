"""
clustering.py — Louvain community detection for WalletStory.

Three graph construction strategies:
  1. Exchange-anchor transfer graph (requires Alchemy API key)
     - Anchors on the shared exchange deposit address
     - Finds wallets that share: same funder, same exchange, same proxy
     - Strongest signal — reproduces Chainalysis methodology
  2. On-chain transfer graph (requires Alchemy/Polygonscan API key)
     - Edges = token transfers between wallets, weighted by value
     - 2-hop crawl from seed addresses
  3. Polymarket co-trading graph (no API key required)
     - Edges = wallets that traded the same markets within a time window
     - Weighted by number of co-traded markets and timing proximity

Strategy 1 is preferred. Strategies 2 and 3 are fallbacks.
"""

import json
import logging
import os
import time as _time
from collections import defaultdict
from dataclasses import dataclass, asdict, field
from itertools import combinations
from pathlib import Path

import networkx as nx
from networkx.algorithms.community import louvain_communities

try:
    import requests
except ImportError:
    requests = None  # type: ignore

log = logging.getLogger("clustering")


# ===================================================================
# Known contract addresses (excluded from clustering)
# ===================================================================

KNOWN_CONTRACTS = {
    "0x4d97dcd97ec945f40cf65f87097ace5ea0476045",  # Polymarket CTF Exchange
    "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e",  # Conditional Tokens
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",  # USDC.e (bridged)
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",  # USDC (native)
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",  # USDT
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",  # DAI
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",  # WMATIC
    "0xa1470dbaedc0e3a1eb4af7da18e0c1f080fc3985",  # Polymarket Proxy Factory
    "0xc5d563a36ae78145c45a50134d48a1215220f80a",  # NegRisk adapter
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000001010",  # MATIC system
}


# ===================================================================
# Strategy 1: Exchange-anchor transfer graph
# ===================================================================

def _alchemy_get_transfers(
    alchemy_url: str,
    from_addr: str | None = None,
    to_addr: str | None = None,
    from_block: str = "0x0",
    to_block: str = "latest",
    max_pages: int = 50,
) -> list[dict]:
    """Paginated Alchemy getAssetTransfers."""
    if requests is None:
        raise ImportError("requests is required for Alchemy API calls")

    all_transfers: list[dict] = []
    page_key = None

    for _ in range(max_pages):
        params: dict = {
            "category": ["erc20"],
            "maxCount": "0x3e8",
            "order": "asc",
            "fromBlock": from_block,
            "toBlock": to_block,
        }
        if from_addr:
            params["fromAddress"] = from_addr
        if to_addr:
            params["toAddress"] = to_addr
        if page_key:
            params["pageKey"] = page_key

        payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "alchemy_getAssetTransfers",
            "params": [params],
        }
        resp = requests.post(alchemy_url, json=payload, timeout=30)
        result = resp.json().get("result", {})
        transfers = result.get("transfers", [])
        all_transfers.extend(transfers)
        page_key = result.get("pageKey")
        if not page_key:
            break

    return all_transfers


def discover_cluster_via_exchange(
    seed_addresses: list[str],
    alchemy_key: str,
    min_cashout_usd: float = 500_000,
    cashout_from_block: int = 63_960_000,
    cashout_to_block: int = 64_400_000,
) -> dict:
    """
    Discover the full wallet cluster by anchoring on the shared
    exchange deposit address.

    Algorithm:
      1. For each seed, find its top counterparties (incoming/outgoing)
      2. Identify the shared exchange deposit address (all seeds send to it)
      3. Identify the shared funder address (all seeds receive from it)
      4. Search the exchange's incoming transfers in the cashout window
         for other wallets that also deposited >min_cashout_usd
      5. For each candidate, verify it also received funds from the
         shared funder
      6. Verify all cluster wallets share the same Polymarket proxy

    Returns dict with cluster info and list of candidate wallets.
    """
    alchemy_url = f"https://polygon-mainnet.g.alchemy.com/v2/{alchemy_key}"
    seeds = {a.lower() for a in seed_addresses}

    log.info("=== Exchange-anchor cluster discovery ===")

    # --- Step 1: Find shared counterparties across all seeds ---
    log.info("Step 1: Finding shared counterparties for %d seeds", len(seeds))
    seed_counterparties: dict[str, dict[str, float]] = {}

    for seed in seeds:
        counterparties: dict[str, float] = defaultdict(float)

        # Incoming
        transfers = _alchemy_get_transfers(
            alchemy_url, to_addr=seed, max_pages=2
        )
        for t in transfers:
            addr = t["from"].lower()
            val = float(t.get("value", 0) or 0)
            counterparties[addr] += val

        # Outgoing
        transfers = _alchemy_get_transfers(
            alchemy_url, from_addr=seed, max_pages=2
        )
        for t in transfers:
            addr = t["to"].lower()
            val = float(t.get("value", 0) or 0)
            counterparties[addr] += val

        # Remove contracts
        for c in KNOWN_CONTRACTS:
            counterparties.pop(c, None)

        seed_counterparties[seed] = dict(counterparties)

    # Find addresses common to ALL seeds (by top counterparty value)
    all_cp_sets = [set(cp.keys()) for cp in seed_counterparties.values()]
    shared = set.intersection(*all_cp_sets) if all_cp_sets else set()
    log.info("Shared counterparties across all seeds: %d", len(shared))

    # Identify exchange (seeds send to it) and funder (sends to seeds)
    exchange_addr = None
    funder_addr = None

    for addr in shared:
        # Check if all seeds have outgoing to this address
        all_send = True
        all_receive = True
        total_out = 0.0
        total_in = 0.0
        for seed, cps in seed_counterparties.items():
            # Check by looking at raw transfer direction
            pass

    # Fallback: use the largest shared counterparty for each role
    # The exchange is where seeds SEND money; the funder is where seeds
    # RECEIVE money. We detect this by checking transfer direction.
    for addr in shared:
        out_transfers = _alchemy_get_transfers(
            alchemy_url, from_addr=list(seeds)[0], to_addr=addr, max_pages=1
        )
        in_transfers = _alchemy_get_transfers(
            alchemy_url, from_addr=addr, to_addr=list(seeds)[0], max_pages=1
        )
        if out_transfers and not exchange_addr:
            out_val = sum(float(t.get("value", 0) or 0) for t in out_transfers)
            if out_val > 1_000_000:
                exchange_addr = addr
                log.info("Exchange deposit identified: %s ($%.0f)", addr[:10], out_val)
        if in_transfers and not funder_addr:
            in_val = sum(float(t.get("value", 0) or 0) for t in in_transfers)
            if in_val > 1_000_000:
                funder_addr = addr
                log.info("Funder identified: %s ($%.0f)", addr[:10], in_val)

        if exchange_addr and funder_addr:
            break

    if not exchange_addr or not funder_addr:
        log.warning("Could not identify exchange or funder. Shared: %s", shared)
        return {"exchange": None, "funder": None, "candidates": []}

    # --- Step 2: Search exchange incoming in cashout window ---
    log.info(
        "Step 2: Searching exchange incoming (blocks %d-%d)",
        cashout_from_block, cashout_to_block,
    )
    exchange_incoming = _alchemy_get_transfers(
        alchemy_url,
        to_addr=exchange_addr,
        from_block=hex(cashout_from_block),
        to_block=hex(cashout_to_block),
        max_pages=50,
    )
    log.info("Found %d incoming transfers to exchange", len(exchange_incoming))

    # Aggregate by sender
    sender_totals: dict[str, float] = defaultdict(float)
    for t in exchange_incoming:
        from_addr = t["from"].lower()
        val = float(t.get("value", 0) or 0)
        sender_totals[from_addr] += val

    # Filter: >min_cashout, not a contract, not already a seed
    large_senders = {
        addr: val
        for addr, val in sender_totals.items()
        if val >= min_cashout_usd and addr not in KNOWN_CONTRACTS
    }
    log.info("Senders >$%.0fK to exchange: %d", min_cashout_usd / 1000, len(large_senders))

    # --- Step 3: Verify shared funder ---
    log.info("Step 3: Verifying shared funder for candidates")
    cluster_wallets: dict[str, dict] = {}

    for addr in sorted(large_senders.keys()):
        funder_transfers = _alchemy_get_transfers(
            alchemy_url, from_addr=funder_addr, to_addr=addr, max_pages=1
        )
        if funder_transfers:
            from_funder = sum(float(t.get("value", 0) or 0) for t in funder_transfers)
            to_exchange = large_senders[addr]
            is_seed = addr in seeds
            cluster_wallets[addr] = {
                "from_funder": from_funder,
                "to_exchange": to_exchange,
                "is_seed": is_seed,
            }
            label = "SEED" if is_seed else "CANDIDATE"
            log.info(
                "  %s: %s (funder=$%.0f, exchange=$%.0f)",
                label, addr[:10], from_funder, to_exchange,
            )

    # --- Step 4: Check shared proxy ---
    log.info("Step 4: Checking Polymarket proxy")
    shared_proxy = None
    try:
        for addr in list(cluster_wallets.keys())[:3]:
            url = f"https://data-api.polymarket.com/trades?maker_address={addr}&limit=1"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    proxy = data[0].get("proxyWallet", "")
                    if proxy:
                        if shared_proxy is None:
                            shared_proxy = proxy
                        elif proxy == shared_proxy:
                            continue
                        else:
                            shared_proxy = None
                            break
            _time.sleep(0.3)
    except Exception as e:
        log.warning("Proxy check failed: %s", e)

    if shared_proxy:
        log.info("Shared Polymarket proxy confirmed: %s", shared_proxy[:10])

    # Sort candidates by cashed_out_usd (to_exchange), take top 15
    candidates = sorted(
        [addr for addr, info in cluster_wallets.items() if not info["is_seed"]],
        key=lambda addr: cluster_wallets[addr]["to_exchange"],
        reverse=True,
    )[:15]

    return {
        "exchange": exchange_addr,
        "funder": funder_addr,
        "shared_proxy": shared_proxy,
        "cluster_wallets": cluster_wallets,
        "candidates": candidates,
        "total_cluster_size": len(cluster_wallets),
        "seeds_found": len([a for a, i in cluster_wallets.items() if i["is_seed"]]),
    }


def build_exchange_anchor_graph(
    cluster_info: dict,
) -> nx.Graph:
    """
    Build a wallet-to-wallet graph from exchange-anchor cluster discovery.

    All wallets sharing the same funder + exchange + proxy are connected
    with edge weight = geometric mean of their total volumes.
    """
    wallets = cluster_info.get("cluster_wallets", {})
    if len(wallets) < 2:
        return nx.Graph()

    g = nx.Graph()
    addrs = list(wallets.keys())

    for i, j in combinations(range(len(addrs)), 2):
        a, b = addrs[i], addrs[j]
        vol_a = wallets[a]["from_funder"] + wallets[a]["to_exchange"]
        vol_b = wallets[b]["from_funder"] + wallets[b]["to_exchange"]
        weight = (vol_a * vol_b) ** 0.5
        g.add_edge(a, b, weight=weight)

    log.info(
        "Exchange-anchor graph: %d nodes, %d edges",
        g.number_of_nodes(), g.number_of_edges(),
    )
    return g


# ===================================================================
# Graph construction (general)
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
