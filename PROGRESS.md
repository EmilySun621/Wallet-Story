# WalletStory — Day 1 Progress

## Pipeline Results (real data, real numbers)

| Metric | Value |
|---|---|
| Wallets analyzed | 3 (Fredi9999, Theo4, PrincessCaro) |
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

## Completed Modules

### 1. Case File (`backend/data/case_polymarket_theo.json`)
- 3/4 wallet addresses verified from public reporting (NYT, WSJ, Bloomberg, Chainalysis)
- Michie address left as TODO — transfer graph clustering may surface it

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
- Two graph strategies: on-chain transfer (Alchemy) + co-trade (API-free)
- Louvain community detection (networkx)
- Modularity scoring, seed community validation
- Candidate wallet surfacing for the "Michie discovery" README claim

### 5. Pipeline Runner (`backend/run_pipeline.py`)
- End-to-end orchestration: fetch → classify → detect → cluster → persist
- Output: `examples/case_polymarket_theo_output.json`

### 6. Environment
- `backend/.env.example` with key placeholders
- `.gitignore` updated

## Blocking / Next Steps

### Needs Alchemy API Key
- Transfer graph (2-hop crawl) for meaningful clustering / candidate surfacing
- Without it, co-trade graph is trivial (only 3 nodes)
- Get free key at https://dashboard.alchemy.com

### Day 2 Priorities
1. Investigator agent (`backend/investigator_agent.py`)
2. EAS attestation (`src/lib/eas.js`)
3. Investigation page (`src/pages/Investigation.jsx`)
4. Case Library page
5. Frontend integration with pipeline API
