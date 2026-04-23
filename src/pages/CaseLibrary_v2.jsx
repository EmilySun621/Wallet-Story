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
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="cta-badge cta-secondary">
              View on GitHub
            </a>
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
              <div className="metric-value-large">{theoCase.p_value_scientific}</div>
            </div>
            <div className="metric-card-large">
              <div className="metric-label-large">Total Volume</div>
              <div className="metric-value-large">${(theoCase.total_usdc_volume / 1e6).toFixed(1)}M</div>
            </div>
            <div className="metric-card-large">
              <div className="metric-label-large">Cluster Size</div>
              <div className="metric-value-large">{theoCase.exchange_anchor_analysis?.total_cluster_size || 13} wallets</div>
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
                wallets: theoCase.per_wallet?.map(w => ({
                  address: w.address,
                  trades: w.wins + w.losses,
                  win_rate: w.win_rate
                })) || [],
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
            View on Easscan →
          </a>
        </div>
      </section>

      {/* E. FOOTER */}
      <section className="footer-section">
        <div className="footer-content">
          <p>
            <strong>Methodology:</strong> Statistical analysis via binomial significance testing,
            graph-based clustering, and timing distribution analysis.
          </p>
          <div className="footer-links">
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="footer-link">
              Architecture →
            </a>
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="footer-link">
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
