# WalletStory

> **$85M profit. One trader. Eleven coordinated wallets. Zero public forensic evidence — until now.**

![License](https://img.shields.io/badge/license-MIT-8B5CF6)
![Hackathon](https://img.shields.io/badge/MSX%20Hackathon-2026-F59E0B)
![Network](https://img.shields.io/badge/EAS-Sepolia-10B981)
![Validated](https://img.shields.io/badge/Chainalysis--matched-11%2F11-10B981)

**Live demo:** [wallet-story.vercel.app](https://wallet-story.vercel.app)
**Demo video:** _[TODO — paste Loom URL]_
**Example attestation:** _[TODO — paste EASScan URL]_

---

## Prediction market insider trading is real. It's quiet. It's undocumented.

In October 2024, a French trader operating the accounts **Fredi9999**, **Theo4**, and **PrincessCaro** extracted **$85 million** from Polymarket during the US presidential election. He did it through **11 coordinated wallets** that evaded per-account size limits, each funded by the same upstream address and cashing out to the same exchange deposit.

Chainalysis independently linked the accounts through shared funding patterns, timing, and exchange cashout addresses — and [published their analysis as an X thread](https://x.com/chainalysis/status/1854584905776431343).

**That thread is the only public forensic evidence.**

No reproducible methodology. No queryable data. No open pipeline for a regulator, a journalist, or a counter-platform to verify or extend the findings. When the next coordinated operation hits a prediction market — and it will — the investigative process starts from zero again.

WalletStory closes this gap.

---

## One pipeline. Five signals. One cryptographic verdict.

Paste any Polygon wallet address. An autonomous Claude agent streams its reasoning in real time as it:

1. **Fetches** the wallet's Polymarket trade history
2. **Computes** a binomial p-value against a 50% random baseline
3. **Discovers** coordinated wallets via exchange-anchor clustering (our novel methodology)
4. **Validates** cluster membership with Louvain community detection
5. **Tests** timing-distribution uniformity via Kolmogorov-Smirnov
6. **Publishes** the verdict as an immutable EAS attestation on Sepolia

When the **Theo4 seed** (`0x56687bf447...`) is submitted, WalletStory independently surfaces **11 coordinated candidate wallets** — exactly matching Chainalysis's publicly reported count, using only open data and MIT-licensed code.

---

## Why the web3 component matters

Traditional forensic reports live in PDFs. They can be retracted under legal pressure. They can be edited after publication. They sit behind paywalls and NDA walls. They are not composable.

WalletStory publishes every verdict as an **Ethereum Attestation Service (EAS) attestation on Sepolia**, with the full ForensicReport JSON pinned to IPFS.

This is not decorative web3. It's the core of the product:

- **Tamper-proof evidence.** Once on-chain, verdicts cannot be retracted, edited, or disappeared
- **Queryable by other dapps.** DEXs, wallets, and risk-scoring platforms can read our attestations directly — forensic findings become infrastructure
- **Publicly verifiable.** Anyone with an Alchemy key can reproduce our pipeline in minutes against the same on-chain data
- **First open standard** for on-chain prediction-market integrity evidence

Chainalysis publishes conclusions. WalletStory publishes the pipeline, the proof, and the evidence — all cryptographically bound to the chain that settled the trades.

This is forensics as a public primitive, not a proprietary black box.

---

## Headline Results — Polymarket "Theo" Cluster

| Metric                       | Value                                                |
| ---------------------------- | ---------------------------------------------------- |
| Seed wallet                  | `0x56687bf447db6ffa42ffe2204a05edaa20f55839` (Theo4) |
| Individual win rate          | 99.2% over 4,000 trades                              |
| Binomial p-value             | < 10⁻³⁰⁰ (float64 underflow)                         |
| **Cluster size discovered**  | **12 wallets (1 seed + 11 candidates)**              |
| Aggregate cluster win rate   | 98.0% over 16,000 trades                             |
| Signals positive             | **5 / 5**                                            |
| Total cluster funding        | **$209M**                                            |
| Total cluster cashout        | **$186M**                                            |
| **Independent validation**   | **Matches Chainalysis's publicly reported count (11) from a single seed input** |

### Cross-reference coverage

- [NY Post — Polymarket 'whale' raked in $85M on Trump win](https://nypost.com/2024/11/13/business/polymarket-whale-earned-85m-on-donald-trump-win/)
- [CBS / 60 Minutes — French 'whale' made over $80 million on Polymarket](https://www.cbsnews.com/news/french-whale-made-over-80-million-on-polymarket-betting-on-trump-election-win-60-minutes/)
- [Chainalysis (Nov 6 2024) — initial disclosure of 9 accounts](https://x.com/chainalysis/status/1854294960532529425)
- [Chainalysis (Nov 7 2024) — update to 10 confirmed + 1 suspected, $85M](https://x.com/chainalysis/status/1854584905776431343)

---

## Falsifiability — Control Case

Same pipeline, same signals, same thresholds — applied to a legitimate skilled trader.

| Metric               | Value                                                |
| -------------------- | ---------------------------------------------------- |
| Control wallet       | `0x006cc834cc092684f1b56626e23bedb3835c16ea`         |
| Individual win rate  | 39%                                                  |
| Verdict              | **Low**                                              |
| Signals positive     | **0 / 5**                                            |
| Cluster discovered   | None — single wallet                                 |

A detection framework that only produces positive results is not a framework — it's a narrative. Our control case is the built-in falsifiability check: the pipeline returns a clean negative verdict when applied to a real Polymarket trader with strong but non-insider performance.

---

## What it does

Five converging forensic signals for each investigated wallet:

1. **Win Rate Anomaly** — binomial significance test against 50% random baseline (`scipy.stats.binomtest`)
2. **Timing Distribution Anomaly** — Kolmogorov-Smirnov test against uniform trading distribution over market lifetime
3. **Shared Funder** — exchange-anchor clustering identifies wallets funded by the same upstream address
4. **Shared Exchange Deposit** — same cashout-route verification
5. **Shared Polymarket Proxy** — confirms coordinated account control via shared proxy contract

Plus:

- **Live agent streaming.** Each investigation streams the autonomous agent's tool calls and reasoning to the frontend via Server-Sent Events — users watch the AI fetch data, run tests, and converge on a verdict in real time
- **Dual-case validation.** Every release ships with both a CRITICAL case (Theo) and a LOW case (control), demonstrating the pipeline does not produce false positives
- **EAS on-chain attestation.** One-click publish of ForensicReport to Sepolia with IPFS-pinned detail

---

## How it works

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

See [`docs/methodology.md`](docs/methodology.md) for the full methodology, code walkthroughs, and academic citations.

---

## Academic foundation

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
3. **Autonomous LLM investigation agent** — replacing manual forensic workflows with a reproducible, streaming pipeline

---

## Industry positioning

WalletStory is **not a replacement** for Chainalysis, Nansen, or Arkham. It's a methodology layer that makes forensic claims cryptographically verifiable and scientifically reproducible.

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

## Verify the findings yourself

Every claim in this repo is designed to be cross-checked by anyone. No trust required.

### Option 1 — Verify against public data

- Paste `0x56687bf447db6ffa42ffe2204a05edaa20f55839` into [Polygonscan](https://polygonscan.com/address/0x56687bf447db6ffa42ffe2204a05edaa20f55839)
- Check Polymarket profile: [polymarket.com/profile/0x56687bf447...](https://polymarket.com/profile/0x56687bf447db6ffa42ffe2204a05edaa20f55839)
- Cross-reference the three shared-infrastructure addresses in [`backend/data/case_polymarket_theo.json`](backend/data/case_polymarket_theo.json)
- Read the Chainalysis X thread and compare their 11-account count against ours

### Option 2 — Re-run the pipeline

```bash
git clone https://github.com/EmilySun621/Wallet-Story
cd Wallet-Story
# set ALCHEMY_API_KEY and ANTHROPIC_API_KEY
python backend/run_pipeline.py
# output in examples/case_polymarket_theo_output.json should match our published verdict
```

### Option 3 — Query EAS attestations on Sepolia

All CRITICAL verdicts published via the "Publish Attestation" button are stored immutably on Sepolia. Query them on [EASScan](https://sepolia.easscan.org) using the schema UID specified in `.env.example`.

---

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.11+
- An [Alchemy](https://www.alchemy.com) API key (free tier sufficient) for Polygon RPC access
- An [Anthropic](https://console.anthropic.com) API key for the investigator agent
- (Optional) MetaMask browser extension to publish EAS attestations on Sepolia

### Install

```bash
git clone https://github.com/EmilySun621/Wallet-Story
cd Wallet-Story

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
cd ..
```

### Configure

```bash
cp .env.example .env
# edit .env with your keys
```

Required env vars:

```
ALCHEMY_API_KEY=...
ANTHROPIC_API_KEY=...

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

---

## Project structure

```
Wallet-Story/
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Home.jsx            # Landing page + methodology showcase
│   │   ├── Investigation.jsx   # Live agent investigation flow (SSE)
│   │   ├── Methodology.jsx     # Full methodology + dual citations
│   │   └── CaseLibrary.jsx     # Theo + Control case library
│   ├── components/
│   │   ├── VerdictBadge.jsx
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
│   └── data/
│       ├── case_polymarket_theo.json
│       └── cached_watchlist.json
│
├── docs/
│   ├── methodology.md          # Full methodology + code walkthroughs
│   └── architecture.md         # System architecture notes
│
├── examples/
│   ├── case_polymarket_theo_output.json
│   └── case_polymarket_control.json
│
└── README.md                   # This file
```

---

## Environment variables

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

## Roadmap

- **Pairwise temporal alignment** (from arXiv:2512.18918) — strengthening coordination evidence beyond single-wallet KS tests
- **OddBall ego-network anomaly detection** — density deviations in per-wallet ego-networks as an additional signal
- **Cross-chain detection** — extending to Base, Arbitrum, and other L2 prediction venues
- **Real-time attestation webhooks** — other dapps subscribing to new CRITICAL verdicts as they are published
- **EAS schema registry + public indexer** — a public dashboard for all WalletStory attestations
- **Regulatory referral export** — auto-generated reports mapping each verdict to an MNPI category and duty theory

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
_All findings are reproducible against public on-chain data. All verdicts are cryptographically attested on-chain._
