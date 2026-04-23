# WalletStory — Day 1 Progress

## Pipeline Results (real data, real numbers)

| Metric | Value |
|---|---|
| Wallets analyzed | 3 seeds (Fredi9999, Theo4, PrincessCaro) |
| Total trades | 12,000 (4,000 per wallet, API cap) |
| Unique markets | 15 |
| Aggregate win rate | **97.3%** |
| Baseline | 50% |
| p-value | **< float64 precision (0.00e+00)** |
| Verdict | **Critical** |
| USDC volume | $15,440,961.77 |
| Cluster match | All 3 seeds in same Louvain community |

### Per-Wallet Breakdown

| Wallet | Wins | Losses | Win Rate | p-value | Verdict | Volume |
|---|---|---|---|---|---|---|
| Fredi9999 | 3,993 | 7 | 99.8% | 0.00 | Critical | $4.26M |
| Theo4 | 3,969 | 31 | 99.2% | 0.00 | Critical | $7.49M |
| PrincessCaro | 3,718 | 282 | 93.0% | 0.00 | Critical | $3.69M |

## Transfer Graph Cluster Discovery

Starting from 3 publicly-reported seed wallets, exchange-anchor clustering independently surfaced **10 additional coordinated wallets** — exceeding Chainalysis's published count of 11 total.

### Clustering Signals (all 13 wallets share)

| Signal | Value |
|---|---|
| Shared funder | `0x3a3bd7bb9528e159577f7c2e685cc81a765002e2` |
| Shared exchange deposit | `0xd36ec33c8bed5a9f7b6630855f1533455b98a418` |
| Shared Polymarket proxy | `0x0484e64092ba4108c2786b61e6fc052d3bf41b1a` |
| Total funding volume | $209,017,424 |
| Total cashout volume | $186,333,103 |

### Surfaced Candidate Wallets

| Address | Funded ($) | Cashed Out ($) | Notes |
|---|---|---|---|
| `0xd235...0f29` | $29.5M | $29.5M | Largest candidate |
| `0x78b9...f5b6` | $16.3M | $5.8M | |
| `0x94a4...6356` | $13.3M | $5.0M | |
| `0x8857...c270` | $11.2M | $7.4M | |
| `0x2378...3fcb` | $10.6M | $6.6M | |
| `0xd0c0...5565` | $9.9M | $6.3M | |
| `0x16f9...9e3` | $9.1M | $6.1M | |
| `0x683a...792c` | $7.9M | $15.3M | Strongest Louvain signal with seeds |
| `0xed22...bd0` | $7.5M | $6.2M | |
| `0x033a...d50` | $7.4M | $7.4M | |

### Methodology

1. For each seed wallet, identified all counterparties via Alchemy `getAssetTransfers`
2. Found shared infrastructure: same funder address, same exchange deposit address
3. Anchored on the exchange deposit, fetched all incoming transfers in post-election cashout window (blocks 63,960,000–64,400,000)
4. Filtered for senders >$500K, verified each received funding from the shared funder
5. Confirmed all 13 wallets share the same Polymarket proxy wallet (`0x0484...`)
6. Ran Louvain community detection: all 13 wallets land in a single community

## Completed Modules

### 1. Case File (`backend/data/case_polymarket_theo.json`)
- 3 wallet addresses verified from public reporting (NYT, WSJ, Bloomberg, Chainalysis)
- 10 candidate wallets surfaced via exchange-anchor clustering
- Cluster infrastructure metadata (shared funder, exchange, proxy)

### 2. Data Fetcher (`backend/data_fetcher.py`)
- Polymarket Data API: paginated trade fetch (offset, handles 400)
- Market resolution: slug + event-based Gamma API lookup (handles negRisk)
- Trade classification: BUY trades annotated with `won` boolean
- Polygon transfers: Alchemy (primary) + Polygonscan (fallback)
- 2-hop counterparty crawl for cluster graph construction

### 3. Insider Detection (`backend/insider_detection.py`)
- Binomial significance test (scipy) on wallet win rates vs 0.5 baseline
- Per-wallet + cluster aggregate analysis
- Verdict: Critical (<1e-10), High (<1e-5), Medium (<1e-2), Low

### 4. Clustering (`backend/clustering.py`)
- **Exchange-anchor strategy** (preferred): anchors on shared exchange deposit, verifies shared funder + proxy
- On-chain transfer graph (Alchemy 2-hop crawl)
- Co-trade graph (API-free fallback)
- Louvain community detection (networkx)
- Modularity scoring, seed community validation
- Candidate wallet surfacing

### 5. Pipeline Runner (`backend/run_pipeline.py`)
- End-to-end orchestration: fetch → classify → detect → cluster → persist
- Output: `examples/case_polymarket_theo_output.json`

### 6. Environment
- `backend/.env.example` with key placeholders
- `.gitignore` updated

## Day 1.5 Overnight Tasks (Autonomous) — COMPLETED

- [x] **backend/investigator_agent.py** — Autonomous LLM agent with Claude tool loop (fetch_wallet_history, run_insider_detection, find_related_wallets, build_cluster_graph, summarize_timeline). Tested on Theo seed address.
- [x] **docs/methodology.md** — Plain English explanation of binomial significance testing (null hypothesis, p-value interpretation, Theo example), Louvain community detection (modularity, algorithm walkthrough), exchange-anchor clustering strategy (3-signal convergence), and ForensicReport schema.
- [x] **docs/architecture.md** — Full system architecture with Mermaid pipeline diagram (Frontend → Backend → APIs → LLM → EAS), stage-by-stage walkthrough, tech stack summary, deployment guide, and future roadmap.
- [x] **README_DRAFT.md** — Complete README following template with Theo case study (real numbers: 13-wallet cluster, $209M/$186M, 97.3% win rate, p < 1e-300), methodology highlights, quick start guide, project structure, and attestation placeholders.
- [x] **backend/api.py** — FastAPI app with endpoints: `POST /investigate` (runs InvestigatorAgent), `GET /case/theo` (precomputed output), `GET /health`. CORS enabled for localhost:5173, Uvicorn entry point.
- [x] **src/pages/Investigation.jsx** — Scaffold with address input, validation, loading state, results panel (verdict badge, metrics grid, cluster info, per-wallet table), fetch to `/investigate` endpoint. Terminal UI theme.
- [x] **src/pages/CaseLibrary.jsx** — Scaffold with featured Theo case card, metrics display, cluster analysis table, per-wallet breakdown, cross-reference sources. Fetches from `/case/theo` endpoint.

All tasks committed. No existing files modified. No destructive commands run.

---

## Day 2 Priorities
1. ~~Investigator agent (`backend/investigator_agent.py`)~~ ✅ Done
2. EAS attestation (`src/lib/eas.js`)
3. ~~Investigation page (`src/pages/Investigation.jsx`)~~ ✅ Done
4. ~~Case Library page~~ ✅ Done
5. Frontend integration with pipeline API (navigation, routing)
6. Testing end-to-end flow (backend → frontend)
