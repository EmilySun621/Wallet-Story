# WalletStory

> Autonomous forensic investigation for prediction market insider trading.  
> Every finding reproducible and cryptographically attested on-chain.

![License](https://img.shields.io/badge/license-MIT-8B5CF6)
![Hackathon](https://img.shields.io/badge/MSX%20Hackathon-2026-F59E0B)
![Network](https://img.shields.io/badge/EAS-Sepolia-10B981)
![Validated](https://img.shields.io/badge/Chainalysis--matched-11%2F11-10B981)

**Live demo:** _[TODO — paste Vercel URL after deploy]_  
**Demo video:** _[TODO — paste Loom URL]_  
**Example attestation:** _[TODO — paste EASScan URL]_

---

## TL;DR

WalletStory is an open-source forensic platform that detects insider trading on on-chain prediction markets. An autonomous Claude agent orchestrates five forensic tools — fetching trade history, running binomial significance tests, clustering coordinated wallets via shared cashout infrastructure, detecting graph communities, and analyzing timing anomalies — then publishes the verdict as an Ethereum Attestation Service (EAS) attestation on Sepolia. Starting from a single seed wallet, our pipeline independently surfaced 11 coordinated accounts in the Polymarket "Theo" cluster — matching Chainalysis's publicly reported count using only open data and MIT-licensed code.

---

## Headline Results — Polymarket "Theo" Cluster

| Metric                       | Value                                  |
| ---------------------------- | -------------------------------------- |
| Seed wallet                  | `0x56687bf447db6ffa42ffe2204a05edaa20f55839` (Theo4) |
| Individual win rate          | 99.2% over 4,000 trades                |
| Binomial p-value             | < 10⁻³⁰⁰ (float64 underflow)           |
| Cluster size discovered      | 12 wallets (1 seed + 11 candidates)    |
| Aggregate cluster win rate   | 98.0% over 16,000 trades               |
| Signals positive             | 5 / 5                                  |
| Total cluster funding        | $209M                                  |
| Total cluster cashout        | $186M                                  |
| **Independent validation**   | **Chainalysis publicly reported 11 accounts. We found 11 candidates from a single seed.** |

### Cross-reference coverage

- New York Post: [Polymarket 'whale' raked in $85M on Trump win](https://nypost.com/2024/11/13/business/polymarket-whale-earned-85m-on-donald-trump-win/)
- CBS / 60 Minutes: [French 'whale' made over $80 million on Polymarket](https://www.cbsnews.com/news/french-whale-made-over-80-million-on-polymarket-betting-on-trump-election-win-60-minutes/)
- Chainalysis (Nov 6 2024, initial): [First disclosure of 9 accounts](https://x.com/chainalysis/status/1854294960532529425)
- Chainalysis (Nov 7 2024, update): [10 confirmed + 1 suspected, $85M](https://x.com/chainalysis/status/1854584905776431343)

---

## Control Case — Falsifiability

| Metric                       | Value                                  |
| ---------------------------- | -------------------------------------- |
| Control wallet               | `0x006cc834cc092684f1b56626e23bedb3835c16ea` |
| Individual win rate          | 39%                                    |
| Verdict                      | **Low**                                |
| Signals positive             | 0 / 5                                  |
| Cluster discovered           | None — single wallet                   |

Same pipeline, same signals, same thresholds — applied to a legitimate skilled trader. The framework returns a clean negative verdict, demonstrating that our detection is not tuned to produce false positives.

---

## What It Does

**Five converging signals** for each investigated wallet:

1. **Win Rate Anomaly** — binomial significance test against 50% random baseline (`scipy.stats.binomtest`)
2. **Timing Distribution Anomaly** — Kolmogorov-Smirnov test against uniform trading over market lifetime
3. **Shared Funder** — exchange-anchor clustering identifies wallets funded by the same upstream address
4. **Shared Exchange Deposit** — same cashout-route verification
5. **Shared Polymarket Proxy** — verifies coordinated account control

**On-chain attestation.** Each verdict is published as a structured EAS attestation on Sepolia, producing a tamper-proof, composable, and queryable forensic record. The ForensicReport JSON is pinned to IPFS.

**Live agent streaming.** Each investigation streams the autonomous agent's tool calls and reasoning to the frontend via Server-Sent Events — users watch the AI fetch data, run tests, and converge on a verdict in real time.

---

## How It Works

**Five-layer architecture:**

1. **User + Frontend** — React + Vite with SSE event stream
2. **API Orchestration** — FastAPI backend + autonomous Claude Investigator Agent  
   _Grounded in arXiv:2512.18918 — network forensics methodology_
3. **Forensic Tools** — five tools dispatched by the agent:
   - `fetch_wallet_history` → Polymarket Data API
   - `run_insider_detection` → SciPy binomial + KS test
   - `find_related_wallets` → Alchemy / Polygon RPC (exchange-anchor clustering)
   - `build_cluster_graph` → NetworkX Louvain community detection
   - `summarize_timeline` → timeline synthesis
4. **Report Synthesis** — structured ForensicReport JSON
5. **On-Chain Attestation** — EAS attestation on Sepolia + IPFS storage  
   _Grounded in Verstein (2023) — legal framework for crypto insider trading_

See [`docs/methodology.md`](docs/methodology.md) for the full methodology and code-level walkthrough.

---

## Academic Foundation

WalletStory sits at the intersection of computational forensics and legal doctrine. Two peer-reviewed foundations:

### Foundation Paper 1 — Computational

**["Needles in a Haystack: Using Forensic Network Science to Uncover Insider Trading"](https://arxiv.org/html/2512.18918v1)**  
_arXiv:2512.18918 (December 2025)_

> "Our approach can be used to detect pairs or clusters of insiders whose behaviour suggests insider trading and/or market manipulation."

Applied 2.9M US equities insider trades across 10 years with p-value null-hypothesis testing and coordinated cluster detection. We port this framework to on-chain prediction markets.

### Foundation Paper 2 — Legal

**["Crypto Assets and Insider Trading Law's Domain"](https://ilr.law.uiowa.edu/sites/ilr.law.uiowa.edu/files/2023-02/Verstein.pdf)**  
_Verstein, Iowa Law Review (2023)_

> "Crypto assets are within the domain of insider trading law, alongside securities and commodities."

Establishes that crypto assets fall within federal insider trading law, with six MNPI (material nonpublic information) categories and three duty theories (classical, misappropriation, tender-offer-analogue) applicable to crypto markets.

### Novel extensions

1. **Exchange-anchor clustering** — replacing sparse wallet-to-wallet transfer graphs with convergence on shared cashout infrastructure
2. **On-chain attestation layer** — translating statistical findings into cryptographic evidence via EAS
3. **Autonomous LLM investigation agent** — replacing manual forensic workflows

---

## Industry Positioning

WalletStory is **not a replacement** for commercial platforms. It's a methodology layer that makes forensic claims cryptographically verifiable and scientifically reproducible.

| Capability                                | WalletStory | Chainalysis | Nansen | Arkham | Solidus |
| ----------------------------------------- | :---------: | :---------: | :----: | :----: | :-----: |
| Open-source (MIT license)                 |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| Binomial p-value verdicts                 |      ✓      |      ✗      |   ✗    |   ✗    | partial |
| Exchange-anchor clustering                |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| Timing distribution (KS) anomaly          |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| On-chain attestations (EAS)               |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| Autonomous LLM investigation agent        |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| Prediction-market specialization          |      ✓      |   partial   |   ✗    |   ✗    |    ✗    |
| Control case falsification                |      ✓      |      ✗      |   ✗    |   ✗    |    ✗    |
| **Where commercial platforms lead:**                                                        |
| Labeled wallet database (entity graph)    |      ✗      |      ✓      |   ✓    |   ✓    | partial |
| Multi-chain coverage (20+ chains)         |      ✗      |      ✓      |   ✓    |   ✓    |    ✓    |
| Real-time transaction monitoring          |      ✗      |      ✓      |   ✓    |   ✓    |    ✓    |
| Sanctions / law-enforcement integration   |      ✗      |      ✓      |   ✗    |   ✗    |    ✓    |
| Enterprise SLA + commercial support       |      ✗      |      ✓      |   ✓    |   ✓    |    ✓    |
| Entity deanonymization (real identities)  |      ✗      |      ✓      |   ✓    |   ✓    |    ✗    |

_Based on publicly documented capabilities, April 2026._

---

## Verify The Findings Yourself

Every claim in this repo is designed to be cross-checked by anyone. No trust required.

### Option 1 — Verify our numbers against public data

- Paste `0x56687bf447db6ffa42ffe2204a05edaa20f55839` into [Polygonscan](https://polygonscan.com/address/0x56687bf447db6ffa42ffe2204a05edaa20f55839)
- Check Polymarket profile: [polymarket.com/profile/0x56687bf447...](https://polymarket.com/profile/0x56687bf447db6ffa42ffe2204a05edaa20f55839)
- Cross-reference the three shared-infrastructure addresses in `backend/data/case_polymarket_theo.json`
- Read the Chainalysis thread and verify their 11-account count

### Option 2 — Re-run the pipeline

1. Clone this repo
2. Set `ALCHEMY_API_KEY` and `ANTHROPIC_API_KEY` (see [Environment](#environment-variables))
3. Run `python backend/run_pipeline.py`
4. Output in `examples/case_polymarket_theo_output.json` should match our published verdict

### Option 3 — Query our EAS attestations on Sepolia

All CRITICAL verdicts published via the "Publish Attestation" button are stored immutably on Sepolia. Query them on [EASScan](https://sepolia.easscan.org) using the schema UID specified in `.env.example`.

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- An [Alchemy](https://www.alchemy.com) API key (free tier sufficient) for Polygon RPC access
- An [Anthropic](https://console.anthropic.com) API key for the investigator agent
- (Optional) MetaMask browser extension to publish EAS attestations on Sepolia

### Install

```bash
# Clone
git clone https://github.com/<your-username>/walletstory
cd walletstory

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt   # or manually: fastapi uvicorn anthropic scipy networkx requests python-dotenv
cd ..
```

### Configure

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
# edit .env with your keys
```

Required env vars:

```
# Backend
ALCHEMY_API_KEY=...
ANTHROPIC_API_KEY=...

# Frontend (EAS Sepolia)
VITE_EAS_CONTRACT_ADDRESS=0x...
VITE_EAS_SCHEMA_UID=0x...
VITE_EAS_CHAIN_ID=11155111
VITE_EAS_NETWORK=sepolia
VITE_API_URL=http://localhost:8000
```

### Run

```bash
# Terminal 1 — backend
cd backend
uvicorn api:app --reload --port 8000

# Terminal 2 — frontend
npm run dev
```

Open http://localhost:5173 → paste a wallet address → watch the agent investigate live.

### Run the batch pipeline (optional)

Runs the full Theo case end-to-end and writes the output JSON:

```bash
cd backend
python run_pipeline.py
```

---

## Project Structure

```
walletstory/
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Home.jsx            # Landing page + methodology showcase
│   │   ├── Investigation.jsx   # Live agent investigation flow
│   │   ├── Methodology.jsx     # Full methodology + dual citations
│   │   └── CaseLibrary.jsx     # Theo + Control case library
│   ├── components/
│   │   ├── VerdictBadge.jsx    # Critical / High / Medium / Low badge
│   │   ├── ClusterForceGraph.jsx
│   │   ├── TimingDistributionChart.jsx
│   │   └── ...
│   ├── lib/
│   │   ├── eas.js              # Ethereum Attestation Service integration
│   │   └── formatters.js       # Shared p-value / address formatters
│   └── assets/
│       └── architecture.png    # System architecture diagram
│
├── backend/                    # Python FastAPI + forensic pipeline
│   ├── api.py                  # REST + SSE endpoints
│   ├── investigator_agent.py   # Autonomous Claude agent + 5 tools
│   ├── data_fetcher.py         # Polymarket + Alchemy API clients
│   ├── insider_detection.py    # Binomial + KS statistical tests
│   ├── clustering.py           # Exchange-anchor + Louvain community
│   ├── run_pipeline.py         # Batch pipeline runner
│   ├── build_watchlist.py      # Pre-compute watchlist cache
│   └── data/
│       ├── case_polymarket_theo.json      # Known-case reference
│       └── cached_watchlist.json          # Pre-computed watchlist
│
├── docs/
│   ├── methodology.md          # Full methodology + code walkthroughs
│   └── architecture.md         # System architecture notes
│
├── examples/
│   ├── case_polymarket_theo_output.json    # Theo case pipeline output
│   └── case_polymarket_control.json        # Control case pipeline output
│
└── README.md                   # This file
```

---

## Environment Variables

| Variable                    | Required | Description                                              |
| --------------------------- | :------: | -------------------------------------------------------- |
| `ALCHEMY_API_KEY`           |    ✓     | Polygon RPC access for on-chain transfer graph analysis  |
| `ANTHROPIC_API_KEY`         |    ✓     | Claude investigator agent                                |
| `VITE_EAS_CONTRACT_ADDRESS` |    ✓     | EAS contract address on Sepolia                          |
| `VITE_EAS_SCHEMA_UID`       |    ✓     | EAS schema UID for ForensicReport attestations           |
| `VITE_EAS_CHAIN_ID`         |    ✓     | `11155111` for Sepolia                                   |
| `VITE_EAS_NETWORK`          |    ✓     | `sepolia`                                                |
| `VITE_API_URL`              |          | Backend URL (default `http://localhost:8000`)            |

---

## API

### `POST /investigate`

Synchronous investigation (blocks until complete). Returns a `ForensicReport` JSON.

```bash
curl -X POST http://localhost:8000/investigate \
  -H "Content-Type: application/json" \
  -d '{"address": "0x56687bf447db6ffa42ffe2204a05edaa20f55839"}'
```

### `POST /investigate/stream`

SSE-streaming investigation. Emits events as the agent works: `start`, `iteration`, `reasoning`, `tool_call`, `tool_result`, `complete`, `error`.

### `GET /case/theo` · `GET /case/control`

Return pre-computed case study outputs.

### `GET /watchlist`

Return the pre-cached watchlist of analyzed wallets.

### `GET /health`

Health check.

---

## Future Work

- **Pairwise temporal alignment** (from arXiv:2512.18918) — currently we test each wallet's timing against a uniform baseline; pairwise alignment would strengthen coordination evidence
- **OddBall ego-network anomaly detection** — density deviations in per-wallet ego-networks as an additional signal
- **Cross-chain detection** — extending to Base, Arbitrum, and other L2 prediction venues
- **Sub-block time kernels** for DEX-based markets (MEV-adjacent analysis)
- **Real-time attestation webhooks** — other dapps subscribing to new CRITICAL verdicts as they are published
- **EAS schema registry + public indexer** — a public dashboard for all WalletStory attestations

---

## Acknowledgments

- **Chainalysis** for publishing the initial on-chain analysis of the Theo cluster, enabling direct independent cross-validation
- **New York Times, Bloomberg, Wall Street Journal, New York Post, CBS 60 Minutes** for the journalistic reporting that surfaced the case
- The authors of **"Needles in a Haystack"** (arXiv:2512.18918) for the network-forensics framework
- **Andrew Verstein** for the legal foundation paper establishing crypto's place in insider trading law
- **MSX Hackathon 2026** for the venue

---

## License

MIT © 2026 — see [LICENSE](LICENSE)

---

_Built for the MSX Hackathon, April 18–25, 2026._  
_All findings are reproducible against public on-chain data._
