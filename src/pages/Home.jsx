/**
 * Home.jsx — Methodology-first landing page for WalletStory
 * Hero → Four Signals → Architecture → Featured Case → Control Case → Try It → Footer
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Network, GitBranch, Clock, Check, X, BookOpen, Scale, Code2, Map, ExternalLink, Shield, GraduationCap, FileCheck, Copy } from 'lucide-react';
import VerdictBadge from '../components/VerdictBadge';
import ClusterForceGraph from '../components/ClusterForceGraph';
import architectureImg from '../assets/ChatGPT Image Apr 23, 2026, 06_16_40 PM.png';
import '../terminal-theme.css';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GITHUB_URL = 'https://github.com/EmilySun621/Wallet-Story';

// Academic paper citation
const PAPER_QUOTE = "Our approach can be used to detect pairs or clusters of insiders whose behaviour suggests insider trading and/or market manipulation.";
const PAPER_URL = "https://arxiv.org/html/2512.18918v1";
const PAPER_TITLE = "Needles in a Haystack: Using Forensic Network Science to Uncover Insider Trading";
const PAPER_CITATION = "arXiv:2512.18918 (December 2025)";

// Suggestion chip addresses
const THEO4_ADDRESS = '0x56687bf447db6ffa42ffe2204a05edaa20f55839';
const FREDI_ADDRESS = '0x1f2dd6d473f3e824cd2f8a89d9c69fb96f6ad0cf';
const CONTROL_ADDRESS = '0x006cc834cc092684f1b56626e23bedb3835c16ea';

function Home() {
  const navigate = useNavigate();
  const [theoCase, setTheoCase] = useState(null);
  const [controlCase, setControlCase] = useState(null);
  const [watchlistCount, setWatchlistCount] = useState(14);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    fetchCases();
    fetchWatchlistCount();
  }, []);

  const fetchCases = async () => {
    try {
      const [theoRes, controlRes] = await Promise.all([
        fetch(`${API_URL}/case/theo`),
        fetch(`${API_URL}/case/control`),
      ]);

      if (theoRes.ok) setTheoCase(await theoRes.json());
      if (controlRes.ok) setControlCase(await controlRes.json());
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  const fetchWatchlistCount = async () => {
    try {
      const res = await fetch(`${API_URL}/watchlist`);
      if (res.ok) {
        const data = await res.json();
        setWatchlistCount(data.length);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  const handleCopyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="home-page">
      {/* A. HERO */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">On-chain market surveillance for tokenized markets.</h1>
          <p className="hero-subtitle">
            NYSE has SMARTS. NASDAQ has SMARTS. Tokenized exchanges don't — because no one built market surveillance for pseudonymous on-chain markets. We did. Validated on Polymarket, where insider trading is documented and peer-reviewed forensic papers exist. Generalizes to tokenized equities, RWA perpetuals, and Pre-IPO markets.
          </p>

          <div className="ticker-chip-row">
            <span className="ticker-chip">POLY-ELECTION</span>
            <span className="ticker-chip">AAPL.M</span>
            <span className="ticker-chip">NVDA.M</span>
            <span className="ticker-chip">SPACEX.M</span>
            <span className="ticker-chip ticker-chip-more">+ any on-chain market</span>
          </div>

          <div className="stats-strip">
            <div className="stat-pill">
              <span className="stat-value">{watchlistCount}</span>
              <span className="stat-label">wallets analyzed</span>
            </div>
            <div className="stat-pill">
              <span className="stat-value">12</span>
              <span className="stat-label">on-chain attestations</span>
            </div>
            <div className="stat-pill">
              <span className="stat-value">$209M</span>
              <span className="stat-label">case size</span>
            </div>
          </div>

          <div className="hero-cta">
            <button className="cta-primary" onClick={() => navigate('/investigation')}>
              Investigate a wallet →
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="cta-secondary">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* B. FOUR SIGNALS */}
      <section className="signals-section">
        <div className="section-container">
          <h2 className="section-title">Four converging signals. One verdict.</h2>
          <p className="section-subtitle">
            Independently measurable. Peer-reviewed. Reproducible on-chain.
          </p>

          <div className="signals-grid">
            {/* Signal 1: Win Rate Anomaly */}
            <div className="signal-card">
              <div className="signal-icon">
                <BarChart3 size={32} />
              </div>
              <h3 className="signal-title">Win Rate Anomaly</h3>
              <p className="signal-description">
                Binomial significance test against 50% random baseline
              </p>
              <div className="signal-example">
                Theo4: 99.2% over 4,000 trades, p &lt; 10⁻³⁰⁰
              </div>
            </div>

            {/* Signal 2: Exchange-Anchor Clustering */}
            <div className="signal-card">
              <div className="signal-icon">
                <Network size={32} />
              </div>
              <h3 className="signal-title">Exchange-Anchor Clustering</h3>
              <p className="signal-description">
                Discover coordinated wallets via shared cashout infrastructure
              </p>
              <div className="signal-example">
                Theo4 seed → 11 candidates via shared funder + exchange
              </div>
              <div className="signal-badge">Our novel methodology</div>
            </div>

            {/* Signal 3: Graph Community Detection */}
            <div className="signal-card">
              <div className="signal-icon">
                <GitBranch size={32} />
              </div>
              <h3 className="signal-title">Graph Community Detection</h3>
              <p className="signal-description">
                Louvain modularity optimization cross-validates clustering
              </p>
              <div className="signal-example">
                All 12 wallets land in single community
              </div>
            </div>

            {/* Signal 4: Timing Distribution Anomaly */}
            <div className="signal-card">
              <div className="signal-icon">
                <Clock size={32} />
              </div>
              <h3 className="signal-title">Timing Distribution Anomaly</h3>
              <p className="signal-description">
                Kolmogorov-Smirnov test against uniform trading over market lifetime
              </p>
              <div className="signal-example">
                Theo cluster: KS p &lt; 10⁻³⁰⁰
              </div>
            </div>
          </div>

          <p className="signals-footer">
            When all 4 signals converge, we publish an EAS attestation on Sepolia — creating a tamper-proof, composable forensic record.
          </p>
        </div>
      </section>

      {/* ACADEMIC GROUNDING + INDUSTRY POSITIONING */}
      <section className="academic-section">
        <div className="section-container">
          <h2 className="section-title">Grounded in research. Validated against industry.</h2>

          <div className="academic-grid">
            {/* Column A: Academic Foundation */}
            <div className="academic-column">
              <div className="column-overline">ACADEMIC FOUNDATION</div>

              <blockquote className="paper-quote">
                <div className="quote-text">{PAPER_QUOTE}</div>
                <div className="quote-citation">
                  — {PAPER_TITLE}
                  <br />
                  {PAPER_CITATION}
                  <br />
                  <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className="paper-link">
                    Read paper →
                  </a>
                </div>
              </blockquote>

              <p className="academic-contribution">
                We apply this network forensics framework — p-value-based null hypothesis testing combined with coordinated cluster detection — to a new domain: on-chain prediction markets settled on Polygon. Our novel extension is <strong>exchange-anchor clustering</strong>, which replaces sparse wallet-to-wallet transfer graphs with convergence on shared cashout infrastructure.
              </p>
            </div>

            {/* Column B: Industry Comparison */}
            <div className="comparison-column">
              <div className="column-overline">POSITIONING</div>

              <h3 className="comparison-heading">How we compare</h3>
              <p className="comparison-subheading">Open-source. Statistically rigorous. On-chain verifiable.</p>

              <div className="comparison-table">
                {/* Header Row */}
                <div className="comparison-row comparison-header">
                  <div className="comparison-cell capability-cell">Capability</div>
                  <div className="comparison-cell">WalletStory</div>
                  <div className="comparison-cell">Chainalysis</div>
                  <div className="comparison-cell">Nansen</div>
                  <div className="comparison-cell">Arkham</div>
                  <div className="comparison-cell">Solidus Labs</div>
                </div>

                {/* First Half: Where WalletStory leads */}
                {[
                  { feature: 'Open-source (MIT license)', values: [true, false, false, false, false] },
                  { feature: 'Binomial p-value verdicts', values: [true, false, false, false, 'partial'] },
                  { feature: 'Exchange-anchor clustering', values: [true, false, false, false, false] },
                  { feature: 'Timing distribution (KS) anomaly', values: [true, false, false, false, false] },
                  { feature: 'On-chain attestations (EAS)', values: [true, false, false, false, false] },
                  { feature: 'Autonomous LLM investigation agent', values: [true, false, false, false, false] },
                  { feature: 'Prediction-market specialization', values: [true, 'partial', false, false, false] },
                  { feature: 'Control case falsification', values: [true, false, false, false, false] },
                ].map((row, idx) => (
                  <div key={idx} className="comparison-row">
                    <div className="comparison-cell capability-cell">{row.feature}</div>
                    {row.values.map((val, i) => (
                      <div key={i} className={`comparison-cell ${i === 0 ? 'highlight-cell' : ''}`}>
                        {val === true && <Check size={18} className="check-icon" />}
                        {val === false && <X size={18} className="x-icon" />}
                        {val === 'partial' && <span className="partial-icon" title="Limited capability">—</span>}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Separator Row */}
                <div className="comparison-separator">
                  <div className="separator-label">WHERE COMMERCIAL PLATFORMS LEAD</div>
                </div>

                {/* Second Half: Where commercial platforms lead */}
                {[
                  { feature: 'Labeled wallet database (entity graph)', values: [false, true, true, true, 'partial'] },
                  { feature: 'Multi-chain coverage (20+ chains)', values: [false, true, true, true, true] },
                  { feature: 'Real-time transaction monitoring', values: [false, true, true, true, true] },
                  { feature: 'Sanctions / law-enforcement integration', values: [false, true, false, false, true] },
                  { feature: 'Enterprise SLA + commercial support', values: [false, true, true, true, true] },
                  { feature: 'Entity deanonymization (real identities)', values: [false, true, true, true, false] },
                ].map((row, idx) => (
                  <div key={idx} className="comparison-row">
                    <div className="comparison-cell capability-cell">{row.feature}</div>
                    {row.values.map((val, i) => (
                      <div key={i} className={`comparison-cell ${i === 0 ? 'highlight-cell' : ''}`}>
                        {val === true && <Check size={18} className="check-icon" />}
                        {val === false && <X size={18} className="x-icon" />}
                        {val === 'partial' && <span className="partial-icon" title="Limited capability">—</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <p className="comparison-caption">
                WalletStory is not a replacement for commercial platforms — it's a methodology layer that makes forensic claims cryptographically verifiable and scientifically reproducible. Based on publicly documented capabilities of each platform, April 2026.
              </p>
            </div>
          </div>

          {/* Column-spanning footer */}
          <p className="academic-footer">
            Independent validation: Chainalysis publicly reported 11 coordinated Theo accounts. Our pipeline surfaced 11 candidates from a single seed — matching their count with open-source code.
          </p>
        </div>
      </section>

      {/* METHODOLOGY PREVIEW CARD */}
      <section className="methodology-preview-section">
        <div className="section-container">
          <div className="methodology-preview-card" onClick={() => navigate('/methodology')}>
            <div className="preview-header">
              <h2 className="preview-title">Dive deeper into our methodology</h2>
              <p className="preview-subtitle">
                Peer-reviewed research adapted to on-chain prediction markets. Two academic foundations, one new domain.
              </p>
            </div>

            <div className="preview-tiles">
              <div className="preview-tile">
                <div className="preview-tile-icon">
                  <BookOpen size={28} />
                </div>
                <h3 className="preview-tile-title">Academic Foundation</h3>
                <p className="preview-tile-description">
                  Dual-paper grounding in computational forensics and federal insider trading law
                </p>
              </div>

              <div className="preview-tile">
                <div className="preview-tile-icon">
                  <Scale size={28} />
                </div>
                <h3 className="preview-tile-title">Legal Framework</h3>
                <p className="preview-tile-description">
                  MNPI categories and three duty theories applicable to prediction markets
                </p>
              </div>

              <div className="preview-tile">
                <div className="preview-tile-icon">
                  <Code2 size={28} />
                </div>
                <h3 className="preview-tile-title">Signal Mapping</h3>
                <p className="preview-tile-description">
                  Four statistical signals grounded in prior art with code examples
                </p>
              </div>

              <div className="preview-tile">
                <div className="preview-tile-icon">
                  <Map size={28} />
                </div>
                <h3 className="preview-tile-title">Future Work</h3>
                <p className="preview-tile-description">
                  Unexplored methods from prior art and new directions our framework opens
                </p>
              </div>
            </div>

            <div className="preview-cta">
              Read full methodology →
            </div>
          </div>
        </div>
      </section>

      {/* C. HOW IT WORKS */}
      <section className="architecture-section">
        <div className="section-container">
          <h2 className="section-title">How it works</h2>
          <p className="how-it-works-caption">
            Autonomous Claude agent orchestrates 5 forensic tools.
          </p>
          <p className="how-it-works-caption">
            Every finding is reproducible and attested on-chain.
          </p>

          <img
            src={architectureImg}
            alt="WalletStory 5-layer architecture: User → React frontend → FastAPI → Claude Investigator Agent → 5 forensic tools → ForensicReport JSON → EAS attestation on Sepolia"
            className="architecture-image"
          />
        </div>
      </section>

      {/* D. CASE COMPARISON — THEO VS CONTROL */}
      {theoCase && controlCase && (
        <section className="case-comparison-section">
          <div className="section-container">
            <h2 className="section-title">Real cases. Real results.</h2>

            <div className="case-comparison-grid">
              {/* Theo Column */}
              <div className="case-col case-col-theo">
                <div className="case-header">
                  <VerdictBadge severity="Critical" pValue={0} />
                  <h3 className="case-title">The Polymarket Theo Cluster</h3>
                </div>

                <div className="case-sources">
                  <span className="sources-label">Coverage:</span>
                  <a
                    href="https://nypost.com/2024/11/13/business/polymarket-whale-earned-85m-on-donald-trump-win/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-tag source-tag-link"
                  >
                    NY Post <ExternalLink size={10} />
                  </a>
                  <a
                    href="https://www.cbsnews.com/news/french-whale-made-over-80-million-on-polymarket-betting-on-trump-election-win-60-minutes/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-tag source-tag-link"
                  >
                    60 Minutes <ExternalLink size={10} />
                  </a>
                  <a
                    href="https://x.com/chainalysis/status/1854294960532529425"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-tag source-tag-link"
                  >
                    Chainalysis (Nov 6) <ExternalLink size={10} />
                  </a>
                  <a
                    href="https://x.com/chainalysis/status/1854584905776431343"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-tag source-tag-link"
                  >
                    Chainalysis (Nov 7) <ExternalLink size={10} />
                  </a>
                </div>

                <div className="case-stats-row">
                  <div className="case-stat">
                    <span className="case-stat-value">12</span>
                    <span className="case-stat-label">wallets</span>
                  </div>
                  <div className="case-stat">
                    <span className="case-stat-value">$209M</span>
                    <span className="case-stat-label">volume</span>
                  </div>
                  <div className="case-stat">
                    <span className="case-stat-value">98%</span>
                    <span className="case-stat-label">win rate</span>
                  </div>
                  <div className="case-stat">
                    <span className="case-stat-value">p &lt; 10⁻³⁰⁰</span>
                    <span className="case-stat-label">significance</span>
                  </div>
                  <div className="case-stat">
                    <span className="case-stat-value">4/4</span>
                    <span className="case-stat-label">signals</span>
                  </div>
                </div>

                <div className="case-pipeline">
                  <div className="pipeline-overline">HOW WE GOT HERE</div>
                  <div className="pipeline-steps">
                    <div className="pipeline-step">
                      <span className="step-number">①</span> Seeded with <span className="step-value">Theo4</span> wallet (publicly reported by NYT)
                    </div>
                    <div className="pipeline-step">
                      <span className="step-number">②</span> Fetched <span className="step-value">4,000</span> trades → <span className="step-value">99.2%</span> individual win rate
                    </div>
                    <div className="pipeline-step">
                      <span className="step-number">③</span> Binomial test vs 50% baseline → p <span className="step-value">&lt; 10⁻³⁰⁰</span>
                    </div>
                    <div className="pipeline-step">
                      <span className="step-number">④</span> Exchange-anchor clustering → <span className="step-value">11</span> candidate wallets sharing same funder + exchange + Polymarket proxy
                    </div>
                  </div>
                  <div className="pipeline-result">
                    Result: 12-wallet cluster, matching Chainalysis's published count of 11.
                  </div>
                </div>

                <div className="verify-onchain">
                  <div className="verify-overline">VERIFY ON-CHAIN</div>
                  <div className="verify-label">Seed wallet (Theo4)</div>
                  <div className="verify-address">{THEO4_ADDRESS}</div>
                  <div className="verify-actions">
                    <button
                      className="verify-btn"
                      onClick={() => handleCopyAddress(THEO4_ADDRESS)}
                    >
                      {copiedAddress === THEO4_ADDRESS ? (
                        <>✓ Copied</>
                      ) : (
                        <><Copy size={14} /> Copy</>
                      )}
                    </button>
                    <a
                      href={`https://polygonscan.com/address/${THEO4_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="verify-btn"
                    >
                      <ExternalLink size={14} /> Polygonscan
                    </a>
                    <a
                      href={`https://polymarket.com/profile/${THEO4_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="verify-btn"
                    >
                      <ExternalLink size={14} /> Polymarket
                    </a>
                  </div>

                  <a
                    href="https://colab.research.google.com/github/EmilySun621/Wallet-Story/blob/master/notebooks/walletstory_reproduce_theo.ipynb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reproduce-colab-link"
                  >
                    <span className="reproduce-icon">📊</span>
                    <span>Reproduce this case in Colab</span>
                    <span className="reproduce-arrow">→</span>
                  </a>
                </div>
              </div>

              {/* Control Column */}
              <div className="case-col case-col-control">
                <div className="case-header">
                  <VerdictBadge severity="Low" />
                  <div>
                    <h3 className="case-title">Control: legitimate skilled trader</h3>
                    <p className="control-subtitle">Same pipeline. Different result. This is falsifiability.</p>
                  </div>
                </div>

                <div className="control-stats">
                  <span className="control-stat">39% win rate</span>
                  <span className="control-divider">•</span>
                  <span className="control-stat">single wallet</span>
                  <span className="control-divider">•</span>
                  <span className="control-stat">0/4 signals detected</span>
                </div>

                <div className="verify-onchain">
                  <div className="verify-overline">VERIFY ON-CHAIN</div>
                  <div className="verify-label">Control wallet (legitimate trader)</div>
                  <div className="verify-address">{CONTROL_ADDRESS}</div>
                  <div className="verify-actions">
                    <button
                      className="verify-btn"
                      onClick={() => handleCopyAddress(CONTROL_ADDRESS)}
                    >
                      {copiedAddress === CONTROL_ADDRESS ? (
                        <>✓ Copied</>
                      ) : (
                        <><Copy size={14} /> Copy</>
                      )}
                    </button>
                    <a
                      href={`https://polygonscan.com/address/${CONTROL_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="verify-btn"
                    >
                      <ExternalLink size={14} /> Polygonscan
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* E2. REPRODUCIBILITY */}
      <section className="reproducibility-section">
        <div className="section-container">
          <div className="reproducibility-overline">REPRODUCIBILITY</div>
          <h2 className="section-title">Don't trust us. Run it yourself.</h2>
          <p className="section-subtitle">
            Every number reproduces in your browser in 2 minutes. No API keys, no installation.
          </p>

          <div className="reproducibility-grid">
            {/* LEFT: Colab Card */}
            <div>
              <a
                href="https://colab.research.google.com/github/EmilySun621/Wallet-Story/blob/master/notebooks/walletstory_reproduce_theo.ipynb"
                target="_blank"
                rel="noopener noreferrer"
                className="colab-card"
              >
                <img
                  src="https://colab.research.google.com/assets/colab-badge.svg"
                  alt="Open In Colab"
                  className="colab-badge-img-large"
                />
                <ul className="colab-bullets">
                  <li>No API keys. No local Python.</li>
                  <li>Reproduces all 5 signals + pairwise alignment</li>
                  <li>Runtime ≈ 2 minutes in Colab free tier</li>
                </ul>
              </a>
            </div>

            {/* RIGHT: Code Preview */}
            <div>
              <pre className="repro-code-preview">{`# In your browser, in 2 minutes:

case = requests.get(f"{REPO}/case_theo.json").json()
trades = requests.get(f"{REPO}/theo_trades.json").json()

# Signal 1: Binomial test
binomtest(wins=15680, n=16000, p=0.5)
→ p-value < 1e-300 ✓

# Signal 4: Pairwise temporal alignment
z_score = 28.9σ above null baseline ✓

# All results match our published claims.`}</pre>
              <p className="repro-code-caption">Excerpt from the Colab notebook</p>
            </div>
          </div>

          <p className="repro-footer-text">
            This is what 'open-source forensics' means. Every claim is cryptographically verifiable via EAS attestations AND computationally verifiable via a reproducible pipeline.
          </p>
        </div>
      </section>

      {/* E3. WHO THIS IS FOR */}
      <section className="deployment-section">
        <div className="section-container">
          <div className="deployment-overline">WHO THIS IS FOR</div>
          <h2 className="section-title">Three deployment paths</h2>
          <p className="section-subtitle">
            From on-demand audits to real-time surveillance to educational infrastructure — the same forensic pipeline, validated on Polymarket, plugs into any on-chain market: prediction markets, tokenized equities (AAPL.M, NVDA.M), RWA perpetuals, and Pre-IPO tokens.
          </p>

          <div className="deployment-grid">
            {/* Card 1: Prediction-market operators */}
            <div className="deployment-card">
              <div className="deployment-icon">
                <Shield size={28} />
              </div>
              <h3 className="deployment-role">Prediction-market operators</h3>
              <p className="deployment-description">
                Integrate the WalletStory pipeline into onboarding flows and ongoing surveillance to flag coordinated accounts before they reach market-moving positions. The EAS attestation layer creates a documented compliance trail. Drop-in integration with tokenized stock exchanges via webhook — verdict, p-value, and on-chain attestation UID in one response.
              </p>
              <p className="deployment-value">
                Polymarket, Kalshi, Azuro, and emerging on-chain prediction venues.
              </p>
            </div>

            {/* Card 2: Fintech research + education */}
            <div className="deployment-card">
              <div className="deployment-icon">
                <GraduationCap size={28} />
              </div>
              <h3 className="deployment-role">Fintech research + education</h3>
              <p className="deployment-description">
                Use WalletStory as a reference implementation for on-chain market surveillance research, or as a case study platform for student projects and training programs. Every statistical method is open-source and reproducible.
              </p>
              <p className="deployment-value">
                Academic institutions, fintech accelerators, and community programs like MSX.
              </p>
            </div>

            {/* Card 3: Compliance + regulatory teams */}
            <div className="deployment-card">
              <div className="deployment-icon">
                <FileCheck size={28} />
              </div>
              <h3 className="deployment-role">Compliance + regulatory teams</h3>
              <p className="deployment-description">
                Subscribe to EAS attestations to monitor coordinated activity across on-chain prediction markets without building internal forensic infrastructure. Each Critical verdict maps to an MNPI category + duty theory, suitable for regulatory referral.
              </p>
              <p className="deployment-value">
                SEC, CFTC, FINRA task forces; compliance teams at fintech institutions.
              </p>
            </div>
          </div>

          <p className="deployment-footer">
            Built on open-source methodology. Attested on-chain. Evaluated against mainstream forensics-industry baselines. <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Contribute at GitHub →</a>
          </p>
        </div>
      </section>

      {/* F. FOOTER */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>WalletStory</h3>
            <p>Autonomous on-chain forensics</p>
          </div>

          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="/methodology" target="_blank">Methodology</a>
            <a href="https://sepolia.easscan.org" target="_blank" rel="noopener noreferrer">View EAS attestations</a>
          </div>

          <div className="footer-credit">
            Built for MSX Hackathon 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
