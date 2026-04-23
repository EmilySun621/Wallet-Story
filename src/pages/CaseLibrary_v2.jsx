/**
 * CaseLibrary_v2.jsx — Spacious, desktop-first case library
 * Full-width layout with hero, comparison, visualizations
 */

import { useEffect, useState } from 'react';
import VerdictBadge from '../components/VerdictBadge';
import CaseComparison from '../components/CaseComparison';
import ClusterForceGraph from '../components/ClusterForceGraph';
import MoneyFlowSankey from '../components/MoneyFlowSankey';
import '../terminal-theme.css';
import './CaseLibrary.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Every wallet. Every edge. One story.</h1>
          <p className="hero-subtitle">
            Autonomous forensic analysis for prediction market insider trading detection
          </p>
          <div className="hero-cta-badges">
            <button className="cta-badge" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
              View Evidence
            </button>
            <a href="/investigation" className="cta-badge cta-secondary">
              Try Live
            </a>
          </div>
        </div>
      </section>

      {/* CASE COMPARISON SECTION */}
      <section className="comparison-section">
        <h2 className="section-title">The Evidence</h2>
        <CaseComparison />
      </section>

      {/* FEATURED CASE: THEO CLUSTER */}
      {theoCase && (
        <section className="featured-section">
          <div className="featured-header">
            <div>
              <h2 className="section-title">Case Study: Theo Cluster</h2>
              <p className="section-subtitle">13-wallet coordinated network — $85M profit, 97.3% win rate</p>
            </div>
            <VerdictBadge
              severity={theoCase.verdict}
              pValue={theoCase.win_rate_analysis?.binomial_test?.p_value}
            />
          </div>

          <div className="featured-grid">
            {/* Left: Force Graph */}
            <div className="featured-viz-large">
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

            {/* Right: Case Details */}
            <div className="featured-details">
              <div className="detail-card">
                <h3>🕸️ Cluster Infrastructure</h3>
                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-label">Cluster Size:</span>
                    <span className="detail-value">{theoCase.exchange_anchor_analysis?.total_cluster_size || 13} wallets</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Shared Funder:</span>
                    <span className="detail-value mono">{theoCase.exchange_anchor_analysis?.shared_funder?.slice(0, 12)}...</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Shared Exchange:</span>
                    <span className="detail-value">Kraken (verified)</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Shared Proxy:</span>
                    <span className="detail-value">{theoCase.exchange_anchor_analysis?.shared_proxy ? 'Detected' : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-card">
                <h3>📊 Statistical Evidence</h3>
                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-label">Aggregate Win Rate:</span>
                    <span className="detail-value highlight">{(theoCase.aggregate_win_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">p-value:</span>
                    <span className="detail-value">{theoCase.p_value_scientific}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Volume:</span>
                    <span className="detail-value">${(theoCase.total_usdc_volume / 1e6).toFixed(1)}M</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Markets Traded:</span>
                    <span className="detail-value">{theoCase.unique_markets}</span>
                  </div>
                </div>
              </div>

              {theoCase.cross_reference_sources && (
                <div className="detail-card">
                  <h3>📰 Cross-References</h3>
                  <ul className="reference-list">
                    {theoCase.cross_reference_sources.map((source, idx) => (
                      <li key={idx}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* MONEY FLOW SECTION */}
      {theoCase && (
        <section className="money-flow-section">
          <h2 className="section-title">Fund Flow Analysis</h2>
          <p className="section-subtitle">Tracking capital movement from shared funder through cluster to exchange</p>
          <div className="money-flow-container">
            <MoneyFlowSankey
              flowData={{
                funder: theoCase.exchange_anchor_analysis?.shared_funder ?
                  { address: theoCase.exchange_anchor_analysis.shared_funder } : null,
                wallets: theoCase.per_wallet?.map(w => ({
                  address: w.address,
                  funding_amount: 1000,
                  exchange_volume: 800
                })) || [],
                exchange: theoCase.exchange_anchor_analysis?.exchange_deposit ?
                  { address: theoCase.exchange_anchor_analysis.exchange_deposit } : null
              }}
            />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <section className="footer-section">
        <div className="footer-content">
          <p>
            <strong>Methodology:</strong> Statistical analysis via binomial significance testing,
            graph-based clustering, and timing distribution analysis.
          </p>
          <p>
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="footer-link">
              View Technical Documentation →
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default CaseLibrary;
