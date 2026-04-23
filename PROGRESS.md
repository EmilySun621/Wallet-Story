# WalletStory — Day 1 Progress

## Completed

### 1. Theo Cluster Case File
- Verified 3 of 4 wallet addresses from public reporting (NYT, WSJ, Bloomberg, Chainalysis)
- **Fredi9999**: `0x1f2dd6d4...` (confirmed via Polymarket profile)
- **Theo4**: `0x56687bf4...` (confirmed via Polymarket Analytics)
- **PrincessCaro**: `0x8119010a...` (confirmed via Polymarket profile)
- **Michie**: address unverified — left as TODO; clustering may independently surface it
- Saved to `backend/data/case_polymarket_theo.json`

### 2. Data Fetcher (`backend/data_fetcher.py`)
- Polymarket Data API: paginated trade fetching (offset-based, handles 400 gracefully)
- Market resolution via Gamma API: slug + event-based lookup (handles negRisk markets)
- Trade classification: BUY trades annotated with `won` boolean based on resolved outcome
- Polygon transfer fetching: Alchemy (primary) + Polygonscan (fallback)
- 2-hop counterparty crawl for cluster graph construction
- **Smoke test results:**
  - Theo4: 4000 trades, **3969 wins / 31 losses (99.2% win rate)**
  - All 12 markets resolved correctly via slug+event lookup

### 3. Environment
- `backend/.env.example` created with key placeholders
- `backend/.env` updated with Alchemy/Polygonscan key slots
- `.gitignore` updated to exclude `.DS_Store`, `__pycache__`, `backend/.env`

## In Progress
- `backend/insider_detection.py` — binomial significance testing
- `backend/clustering.py` — Louvain community detection

## Pending
- End-to-end pipeline run on 3 wallets
- `examples/case_polymarket_theo_output.json`
- Commit milestone: "Day 1: statistics pipeline + Theo case baseline"
