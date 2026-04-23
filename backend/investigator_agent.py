"""
investigator_agent.py — Autonomous LLM agent for wallet forensic investigation.

The agent uses an iterative reasoning loop to:
  1. Fetch wallet transaction history
  2. Run insider detection on Polymarket trades
  3. Find related wallets via clustering
  4. Build cluster graph
  5. Summarize findings into a ForensicReport

Tools available to the agent:
  - fetch_wallet_history: Get Polymarket trade data for a wallet
  - run_insider_detection: Statistical analysis of win rates
  - find_related_wallets: Clustering via exchange-anchor or co-trade
  - build_cluster_graph: Construct transfer/co-trade graph
  - summarize_timeline: Generate timeline of key events

The agent loops until it has enough information to generate a complete ForensicReport.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Literal

import anthropic

from data_fetcher import fetch_polymarket_trades, classify_trades
from insider_detection import analyze_cluster
from clustering import (
    discover_cluster_via_exchange,
    build_exchange_anchor_graph,
    analyze_theo_cluster,
    build_cotrade_graph,
)

logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
log = logging.getLogger("investigator")

# Tool schemas for Claude
TOOLS = [
    {
        "name": "fetch_wallet_history",
        "description": "Fetch Polymarket trade history for a given wallet address. Returns list of trades with outcomes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "Ethereum wallet address (0x...)",
                },
                "max_pages": {
                    "type": "integer",
                    "description": "Maximum pages to fetch (default: 10, ~4000 trades)",
                    "default": 10,
                },
            },
            "required": ["address"],
        },
    },
    {
        "name": "run_insider_detection",
        "description": "Run binomial statistical test on wallet trade data to detect insider trading signals. Returns p-value, verdict (Critical/High/Medium/Low), win rate. NOTE: Only call this AFTER fetching wallet histories with fetch_wallet_history.",
        "input_schema": {
            "type": "object",
            "properties": {
                "addresses": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of wallet addresses to analyze (must have been fetched already)",
                },
            },
            "required": ["addresses"],
        },
    },
    {
        "name": "find_related_wallets",
        "description": "Discover wallets related to seed addresses via exchange-anchor clustering or on-chain graph analysis. Returns candidate addresses.",
        "input_schema": {
            "type": "object",
            "properties": {
                "seed_addresses": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of seed wallet addresses to cluster from",
                },
                "strategy": {
                    "type": "string",
                    "enum": ["exchange-anchor", "co-trade"],
                    "description": "Clustering strategy (exchange-anchor requires Alchemy API key)",
                    "default": "exchange-anchor",
                },
            },
            "required": ["seed_addresses"],
        },
    },
    {
        "name": "build_cluster_graph",
        "description": "Build a network graph of related wallets using transfer or co-trade edges. Returns graph statistics and community detection results.",
        "input_schema": {
            "type": "object",
            "properties": {
                "addresses": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of wallet addresses to include in graph",
                },
                "graph_type": {
                    "type": "string",
                    "enum": ["transfer", "co-trade"],
                    "description": "Type of graph to build",
                    "default": "transfer",
                },
            },
            "required": ["addresses"],
        },
    },
    {
        "name": "summarize_timeline",
        "description": "Generate a timeline summary of key trading events and cluster activity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "trades": {
                    "type": "object",
                    "description": "Dict mapping wallet addresses to their trade lists",
                },
            },
            "required": ["trades"],
        },
    },
]


class InvestigatorAgent:
    """Autonomous forensic investigation agent powered by Claude."""

    def __init__(self, api_key: str | None = None):
        self.client = anthropic.Anthropic(
            api_key=api_key or os.getenv("ANTHROPIC_API_KEY")
        )
        self.model = "claude-sonnet-4-20250514"
        self.conversation_history: list[dict] = []

        # Agent state
        self.wallet_trades: dict[str, list[dict]] = {}
        self.classified_trades: dict[str, list[dict]] = {}
        self.insider_results: dict[str, Any] = {}
        self.cluster_info: dict[str, Any] = {}
        self.related_wallets: list[str] = []

    def investigate(self, seed_address: str, max_iterations: int = 10) -> dict:
        """
        Run autonomous investigation starting from a seed wallet address.

        Returns a ForensicReport dict with all findings.
        """
        log.info("Starting investigation for %s", seed_address)

        system_prompt = f"""You are a blockchain forensic investigator analyzing wallet {seed_address} for potential insider trading on Polymarket.

Your goal is to produce a complete ForensicReport with:
1. Trade history and statistical analysis (insider detection)
2. Related wallet cluster discovery
3. Graph analysis (community detection)
4. Timeline summary

You have access to these tools:
- fetch_wallet_history: Get trade data
- run_insider_detection: Statistical significance testing
- find_related_wallets: Cluster discovery
- build_cluster_graph: Network analysis
- summarize_timeline: Event timeline

Work methodically:
1. First, fetch the wallet's trade history
2. Run insider detection to check for statistical anomalies
3. If suspicious, find related wallets via clustering
4. Build a graph to analyze the cluster structure
5. Summarize the timeline

When you have gathered enough evidence, respond with "INVESTIGATION_COMPLETE" and I will generate the final report.

Be thorough but efficient. Stop when you have:
- Trade data for seed + any related wallets found
- Statistical analysis results
- Cluster analysis (if related wallets exist)
- Timeline summary
"""

        self.conversation_history = [
            {
                "role": "user",
                "content": f"Investigate wallet address: {seed_address}",
            }
        ]

        for iteration in range(max_iterations):
            log.info("Agent iteration %d/%d", iteration + 1, max_iterations)

            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                tools=TOOLS,
                messages=self.conversation_history,
            )

            # Check if agent wants to stop
            for block in response.content:
                if hasattr(block, "text") and "INVESTIGATION_COMPLETE" in block.text:
                    log.info("Agent signaled investigation complete")
                    return self._generate_report(seed_address)

            # Process tool calls
            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = self._execute_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, default=str),
                        })

                # Add assistant message and tool results to history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response.content,
                })
                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results,
                })

            elif response.stop_reason == "end_turn":
                # Agent finished thinking, add to history and continue
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response.content,
                })

                # Prompt agent to continue
                self.conversation_history.append({
                    "role": "user",
                    "content": "Continue your investigation or type INVESTIGATION_COMPLETE when done.",
                })
            else:
                log.warning("Unexpected stop_reason: %s", response.stop_reason)
                break

        log.info("Max iterations reached, generating report")
        return self._generate_report(seed_address)

    def _execute_tool(self, tool_name: str, tool_input: dict) -> dict:
        """Execute a tool and return results."""
        log.info("Executing tool: %s", tool_name)

        try:
            if tool_name == "fetch_wallet_history":
                return self._fetch_wallet_history(**tool_input)
            elif tool_name == "run_insider_detection":
                return self._run_insider_detection(**tool_input)
            elif tool_name == "find_related_wallets":
                return self._find_related_wallets(**tool_input)
            elif tool_name == "build_cluster_graph":
                return self._build_cluster_graph(**tool_input)
            elif tool_name == "summarize_timeline":
                return self._summarize_timeline(**tool_input)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            log.error("Tool execution error: %s", e, exc_info=True)
            return {"error": str(e)}

    def _fetch_wallet_history(self, address: str, max_pages: int = 10) -> dict:
        """Tool: Fetch and classify Polymarket trades."""
        addr = address.lower()

        trades = fetch_polymarket_trades(addr, max_pages=max_pages)
        classified = classify_trades(trades)

        self.wallet_trades[addr] = trades
        self.classified_trades[addr] = classified

        wins = sum(1 for t in classified if t.get("won") is True)
        losses = sum(1 for t in classified if t.get("won") is False)

        return {
            "address": addr,
            "total_trades": len(classified),
            "directional_trades": wins + losses,
            "wins": wins,
            "losses": losses,
            "win_rate": wins / (wins + losses) if (wins + losses) > 0 else 0,
        }

    def _run_insider_detection(self, addresses: list[str]) -> dict:
        """Tool: Run statistical insider detection."""
        # Build wallet_data from self.classified_trades for requested addresses
        wallet_data = {}
        wallet_infos = []

        for addr in addresses:
            addr_lower = addr.lower()
            if addr_lower in self.classified_trades:
                wallet_data[addr_lower] = self.classified_trades[addr_lower]
                wallet_infos.append({"address": addr_lower, "username": addr_lower[:10]})
            else:
                # Address not fetched yet, skip
                continue

        if not wallet_data:
            return {
                "error": "No wallet data found. Call fetch_wallet_history first.",
                "aggregate": {"verdict": "Low", "p_value": 1.0},
                "per_wallet": []
            }

        results = analyze_cluster(wallet_infos, wallet_data, baseline=0.5)
        self.insider_results = results

        return {
            "aggregate": results["aggregate"],
            "per_wallet": results["per_wallet"],
        }

    def _find_related_wallets(
        self, seed_addresses: list[str], strategy: str = "exchange-anchor"
    ) -> dict:
        """Tool: Find related wallets via clustering."""
        alchemy_key = os.getenv("ALCHEMY_API_KEY", "")

        if strategy == "exchange-anchor" and alchemy_key:
            cluster_info = discover_cluster_via_exchange(
                seed_addresses, alchemy_key, min_cashout_usd=500_000
            )
            self.cluster_info = cluster_info

            candidates = cluster_info.get("candidates", [])
            self.related_wallets = candidates

            return {
                "strategy": "exchange-anchor",
                "candidates_found": len(candidates),
                "candidates": candidates[:10],  # Return top 10
                "total_cluster_size": cluster_info.get("total_cluster_size", 0),
                "shared_infrastructure": {
                    "funder": cluster_info.get("funder"),
                    "exchange": cluster_info.get("exchange"),
                    "proxy": cluster_info.get("shared_proxy"),
                },
            }
        else:
            # Fall back to co-trade clustering
            if not self.wallet_trades:
                return {"error": "No trade data available for co-trade clustering"}

            graph = build_cotrade_graph(self.wallet_trades, time_window_secs=172800)
            analysis = analyze_theo_cluster(seed_addresses, graph, "co-trade")

            return {
                "strategy": "co-trade",
                "graph_nodes": analysis.graph_nodes,
                "graph_edges": analysis.graph_edges,
                "communities_found": analysis.communities_found,
                "candidates": analysis.candidate_wallets,
            }

    def _build_cluster_graph(
        self, addresses: list[str], graph_type: str = "transfer"
    ) -> dict:
        """Tool: Build and analyze cluster graph."""
        if graph_type == "transfer" and self.cluster_info:
            graph = build_exchange_anchor_graph(self.cluster_info)
        else:
            # Use co-trade graph
            graph = build_cotrade_graph(
                {addr: self.wallet_trades.get(addr, []) for addr in addresses},
                time_window_secs=172800,
            )

        analysis = analyze_theo_cluster(addresses, graph, graph_type)

        return {
            "graph_type": graph_type,
            "nodes": analysis.graph_nodes,
            "edges": analysis.graph_edges,
            "communities": analysis.communities_found,
            "modularity": analysis.modularity_score,
            "all_seeds_connected": analysis.all_seeds_in_same_community,
            "seed_community_size": analysis.seed_community_size,
        }

    def _summarize_timeline(self, trades: dict) -> dict:
        """Tool: Generate timeline of trading activity."""
        all_trades = []
        for addr, trade_list in trades.items():
            for t in trade_list:
                if "timestamp" in t:
                    all_trades.append({
                        "wallet": addr[:10],
                        "timestamp": t["timestamp"],
                        "market": t.get("slug", "unknown"),
                        "side": t.get("side"),
                        "outcome": t.get("outcome"),
                        "won": t.get("won"),
                    })

        all_trades.sort(key=lambda x: x["timestamp"])

        if not all_trades:
            return {"timeline": []}

        first = all_trades[0]["timestamp"]
        last = all_trades[-1]["timestamp"]

        return {
            "first_trade": first,
            "last_trade": last,
            "total_trades": len(all_trades),
            "sample_recent": all_trades[-5:],  # Last 5 trades
        }

    def _generate_report(self, seed_address: str) -> dict:
        """Generate final ForensicReport from agent state."""
        log.info("Generating ForensicReport")

        all_addresses = [seed_address.lower()] + self.related_wallets

        return {
            "case_name": f"Investigation: {seed_address[:10]}...",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "seed_address": seed_address,
            "wallets_analyzed": len(self.classified_trades),
            "total_cluster_size": len(all_addresses),
            "insider_detection": self.insider_results.get("aggregate", {}),
            "per_wallet": self.insider_results.get("per_wallet", []),
            "cluster_info": {
                "candidates_found": len(self.related_wallets),
                "candidates": self.related_wallets[:20],
                "shared_infrastructure": (
                    {
                        "funder": self.cluster_info.get("funder"),
                        "exchange": self.cluster_info.get("exchange"),
                        "proxy": self.cluster_info.get("shared_proxy"),
                    }
                    if self.cluster_info
                    else None
                ),
            },
            "methodology": "Autonomous agent investigation using statistical analysis and graph clustering",
            "agent_iterations": len(self.conversation_history) // 2,
        }


def test_theo_investigation():
    """Test the agent on the Theo seed address."""
    theo_address = "0x56687bf447db6ffa42ffe2204a05edaa20f55839"

    agent = InvestigatorAgent()
    report = agent.investigate(theo_address, max_iterations=15)

    print("\n" + "=" * 60)
    print("FORENSIC REPORT")
    print("=" * 60)
    print(json.dumps(report, indent=2, default=str))

    return report


if __name__ == "__main__":
    test_theo_investigation()
