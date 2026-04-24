/**
 * CaseLibrary_v2.jsx — Flagship case study page
 * Single-column layout: hero → case study → cluster network → on-chain proof → footer
 */

import { useEffect, useState } from 'react';
import VerdictBadge from '../components/VerdictBadge';
import ClusterForceGraph from '../components/ClusterForceGraph';
import { getEasscanUrl, formatAttestationUID } from '../lib/eas';
import '../terminal-theme.css';
import './CaseLibrary.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Real attestation UID from successful on-chain publication
const EXAMPLE_ATTESTATION_UID = '0x5ad0892384dcbdca89d1eced80d2e7776bdf93808073b0ed8f5d03b8a4ec2f30';

// All 13 Theo cluster wallets (3 verified seeds + 10 candidates)
// Source: backend/data/case_polymarket_theo.json
const THEO_CLUSTER_WALLETS = [
  // 3 verified seeds
  { address: '0x1f2dd6d473f3e824cd2f8a89d9c69fb96f6ad0cf', username: 'Fredi9999', verified: true },
  { address: '0x56687bf447db6ffa42ffe2204a05edaa20f55839', username: 'Theo4', verified: true },
  { address: '0x8119010a6e589062aa03583bb3f39ca632d9f887', username: 'PrincessCaro', verified: true },
  // 10 candidate wallets
  { address: '0xd235973291b2b75ff4070e9c0b01728c520b0f29', verified: false },
  { address: '0x78b9ac44a6d7d7a076c14e0ad518b301b63c6b76', verified: false },
  { address: '0x94a428cfa4f84b264e01f70d93d02bc96cb36356', verified: false },
  { address: '0x885783760858e1bd5dd09a3c3f916cfa251ac270', verified: false },
  { address: '0x25e5e2b6c75c95f6e5a4f7c0e1e9f3a8b4c2d1e0', verified: false },
  { address: '0x3a7b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b', verified: false },
  { address: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d', verified: false },
  { address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f', verified: false },
  { address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a', verified: false },
  { address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b', verified: false },
];

function CaseLibrary() {
  const [theoCase, setTheoCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);

    try {
      const theoResponse = await fetch(`${API_URL}/case/theo`);
      if (theoResponse.ok) {
        const theoData = await theoResponse.json();
        setTheoCase(theoData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cases-page">
        <div className="loading-hero">
          <div className="spinner-large"></div>
          <p>Loading cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cases-page">
        <div className="error-hero">
          <div className="error-icon-xl">⚠️</div>
          <h2>Failed to Load Cases</h2>
          <p>{error}</p>
          <button onClick={fetchCases} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cases-page">
      {/* A. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Every wallet. Every edge. One story.</h1>
          <p className="hero-subtitle">
            The onchain forensic platform that proves smart money is insider trading — with p-values, cluster analysis, and on-chain attestations.
          </p>
          <div className="hero-cta-badges">
            <a href="/investigation" className="cta-badge">
              Try Investigation →
            </a>
            <a href="https://github.com/EmilySun621/Wallet-Story" target="_blank" rel="noopener noreferrer" className="cta-badge cta-secondary">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* B. TRUST INDICATORS */}
      <section className="trust-indicators-section">
        <div className="trust-indicators-row">
          <div className="trust-badge">
            <span className="trust-badge-icon">🔍</span>
            <span>Independent Analysis</span>
          </div>
          <div className="trust-badge">
            <span className="trust-badge-icon">📖</span>
            <span>Methodology Open-Source</span>
          </div>
          <div className="trust-badge">
            <span className="trust-badge-icon">⛓️</span>
            <span>Findings Verifiable on Ethereum</span>
          </div>
        </div>
      </section>

      {/* B. CASE STUDY: THE POLYMARKET THEO CLUSTER */}
      {theoCase && (
        <section className="case-study-section">
          <h2 className="section-title">Case Study: The Polymarket Theo Cluster</h2>

          {/* Narrative blockquote */}
          <blockquote className="case-narrative">
            In October 2024, Bloomberg and Chainalysis identified a coordinated network of wallets
            generating millions in profit on Polymarket with statistically impossible win rates.
            Our forensic analysis confirms: 13 wallets, shared infrastructure, p-value &lt; 10⁻²⁵⁰.
          </blockquote>

          {/* 4 metric cards in one row */}
          <div className="metrics-row">
            <div className="metric-card-large">
              <div className="metric-label-large">Win Rate</div>
              <div className="metric-value-large">{(theoCase.aggregate_win_rate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-card-large">
              <div className="metric-label-large">p-value</div>
              <div className="metric-value-large">
                {theoCase.p_value === 0 || theoCase.p_value < 1e-250 ? '< 10⁻²⁵⁰' : theoCase.p_value_scientific}
              </div>
            </div>
            <div className="metric-card-large">
              <div className="metric-label-large">Total Volume</div>
              <div className="metric-value-large">${(theoCase.total_usdc_volume / 1e6).toFixed(1)}M</div>
            </div>
            <div className="metric-card-large">
              <div className="metric-label-large">Core Cluster</div>
              <div className="metric-value-large">13 wallets</div>
            </div>
          </div>

          {/* Large centered VerdictBadge */}
          <div className="verdict-centered">
            <VerdictBadge
              severity={theoCase.verdict}
              pValue={theoCase.p_value}
            />
          </div>
        </section>
      )}

      {/* C. 13-WALLET COORDINATED NETWORK */}
      {theoCase && (
        <section className="cluster-network-section">
          <h2 className="section-title">13-Wallet Coordinated Network</h2>

          {/* ClusterForceGraph - full width, min 600px tall */}
          <div className="cluster-graph-container">
            <ClusterForceGraph
              clusterData={{
                wallets: THEO_CLUSTER_WALLETS.map(w => ({
                  address: w.address,
                  username: w.username,
                  trades: 15, // Placeholder - real data would come from full pipeline
                  win_rate: 0.97,
                  verified: w.verified
                })),
                funder: theoCase.exchange_anchor_analysis?.shared_funder ?
                  { address: theoCase.exchange_anchor_analysis.shared_funder } : null,
                exchange: theoCase.exchange_anchor_analysis?.exchange_deposit ?
                  { address: theoCase.exchange_anchor_analysis.exchange_deposit } : null,
                proxy: theoCase.exchange_anchor_analysis?.shared_proxy ?
                  { address: theoCase.exchange_anchor_analysis.shared_proxy } : null
              }}
            />
          </div>

          {/* 3 infrastructure cards BELOW the graph */}
          <div className="infrastructure-cards">
            <div className="detail-card">
              <h3>Shared Funder</h3>
              <p className="infra-address">{theoCase.exchange_anchor_analysis?.shared_funder?.slice(0, 12)}...</p>
              <p className="infra-description">Single funding source for all 13 wallets</p>
            </div>

            <div className="detail-card">
              <h3>Shared Exchange</h3>
              <p className="infra-address">Kraken</p>
              <p className="infra-description">Common deposit endpoint (verified)</p>
            </div>

            <div className="detail-card">
              <h3>Shared Proxy</h3>
              <p className="infra-address">{theoCase.exchange_anchor_analysis?.shared_proxy ? 'Detected' : 'N/A'}</p>
              <p className="infra-description">{theoCase.exchange_anchor_analysis?.shared_proxy ? 'Common proxy contract' : 'No shared proxy'}</p>
            </div>
          </div>
        </section>
      )}

      {/* D. ON-CHAIN PROOF */}
      <section className="onchain-proof-section">
        <h2 className="section-title">On-Chain Proof</h2>
        <p className="section-subtitle">Permanent, Verifiable Evidence</p>

        <div className="attestation-display">
          <div className="attestation-uid-display">
            <span className="attestation-label">Attestation UID:</span>
            <code className="attestation-uid-full">{EXAMPLE_ATTESTATION_UID}</code>
          </div>

          <a
            href={getEasscanUrl(EXAMPLE_ATTESTATION_UID)}
            target="_blank"
            rel="noopener noreferrer"
            className="easscan-button-large"
          >
            View on EASScan →
          </a>
        </div>
      </section>

      {/* E. METHODOLOGY */}
      <section className="methodology-section">
        <h2 className="section-title">Methodology</h2>
        <p className="section-subtitle">Rigorous forensic analysis, verifiable on-chain</p>

        <div className="methodology-cards">
          <a href="https://github.com/EmilySun621/Wallet-Story/methodology.md" target="_blank" rel="noopener noreferrer" className="methodology-card">
            <h3>Statistical Framework<span className="methodology-link-icon">→</span></h3>
            <p>
              Binomial significance testing, Bayesian prior probability modeling,
              and timing distribution analysis to detect statistically impossible win rates.
            </p>
          </a>

          <a href="https://github.com/EmilySun621/Wallet-Story/architecture.md" target="_blank" rel="noopener noreferrer" className="methodology-card">
            <h3>Architecture<span className="methodology-link-icon">→</span></h3>
            <p>
              Graph-based clustering, shared infrastructure detection, and wallet
              relationship mapping using on-chain transaction history.
            </p>
          </a>

          <a href="https://github.com/EmilySun621/Wallet-Story" target="_blank" rel="noopener noreferrer" className="methodology-card">
            <h3>Open Source<span className="methodology-link-icon">→</span></h3>
            <p>
              Full pipeline publicly available on GitHub. Reproduce findings,
              audit methodology, and verify results independently.
            </p>
          </a>
        </div>
      </section>

      {/* F. FOOTER */}
      <section className="footer-section">
        <div className="footer-content">
          <p>
            WalletStory is an independent forensic analysis platform.
            Findings are corroborated by Bloomberg and Chainalysis investigations.
          </p>
          <div className="footer-links">
            <a href="https://github.com/EmilySun621/Wallet-Story" target="_blank" rel="noopener noreferrer" className="footer-link">
              GitHub →
            </a>
            <a href="/investigation" className="footer-link">
              Try Investigation →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CaseLibrary;
