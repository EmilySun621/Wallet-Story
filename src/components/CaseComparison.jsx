import { useState, useEffect } from 'react';
import VerdictBadge from './VerdictBadge';
import './CaseComparison.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * CaseComparison — Side-by-side comparison of Theo cluster vs Control case
 *
 * Fetches forensic reports from /case/theo and /case/control endpoints
 * Displays key metrics in parallel for easy comparison
 */
export default function CaseComparison() {
  const [theoCase, setTheoCase] = useState(null);
  const [controlCase, setControlCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const [theoRes, controlRes] = await Promise.all([
          fetch(`${API_URL}/case/theo`),
          fetch(`${API_URL}/case/control`)
        ]);

        if (!theoRes.ok || !controlRes.ok) {
          throw new Error('Failed to fetch case data');
        }

        const [theoData, controlData] = await Promise.all([
          theoRes.json(),
          controlRes.json()
        ]);

        setTheoCase(theoData);
        setControlCase(controlData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="case-comparison-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading case data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="case-comparison-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  const getSeverity = (verdict) => {
    if (!verdict) return 'Low';
    return verdict; // verdict is already "Critical", "High", "Medium", "Low"
  };

  return (
    <div className="case-comparison-container">
      <h2 className="comparison-title">Case Comparison: Theo Cluster vs Control</h2>

      <div className="comparison-grid">
        {/* Theo Cluster Column */}
        <div className="case-column theo-column">
          <div className="case-header">
            <h3 className="case-name">Theo Cluster</h3>
            <p className="case-subtitle">13-wallet coordinated network</p>
          </div>

          <VerdictBadge
            severity={getSeverity(theoCase?.verdict)}
            pValue={theoCase?.p_value}
          />

          <div className="case-metrics">
            <div className="metric-row">
              <span className="metric-label">Win Rate:</span>
              <span className="metric-value highlight">
                {theoCase?.aggregate_win_rate ? (theoCase.aggregate_win_rate * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Total Trades:</span>
              <span className="metric-value">
                {theoCase?.total_trades_analyzed?.toLocaleString() || 0}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Wins:</span>
              <span className="metric-value">
                {theoCase?.aggregate_win_rate && theoCase?.total_trades_analyzed ?
                  Math.round(theoCase.aggregate_win_rate * theoCase.total_trades_analyzed).toLocaleString() : 0}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Cluster Size:</span>
              <span className="metric-value">
                {theoCase?.cluster_summary?.total_wallets || 0} wallets
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Infrastructure Signals:</span>
              <span className="metric-value">
                {[
                  theoCase?.funder_analysis?.shared_funder_count > 0 ? 'Funder' : null,
                  theoCase?.exchange_analysis?.shared_exchange_count > 0 ? 'Exchange' : null,
                  theoCase?.proxy_analysis?.shared_proxy_count > 0 ? 'Proxy' : null
                ].filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Timing Anomaly:</span>
              <span className="metric-value">
                {theoCase?.timing_analysis?.ks_vs_uniform?.p_value < 1e-5 ? 'Detected' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Control Case Column */}
        <div className="case-column control-column">
          <div className="case-header">
            <h3 className="case-name">Control</h3>
            <p className="case-subtitle">Random baseline wallet</p>
          </div>

          <VerdictBadge
            severity={getSeverity(controlCase?.verdict)}
            pValue={controlCase?.p_value}
            pulse={false}
          />

          <div className="case-metrics">
            <div className="metric-row">
              <span className="metric-label">Win Rate:</span>
              <span className="metric-value">
                {controlCase?.aggregate_win_rate ? (controlCase.aggregate_win_rate * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Total Trades:</span>
              <span className="metric-value">
                {controlCase?.total_trades_analyzed?.toLocaleString() || 0}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Wins:</span>
              <span className="metric-value">
                {controlCase?.aggregate_win_rate && controlCase?.total_trades_analyzed ?
                  Math.round(controlCase.aggregate_win_rate * controlCase.total_trades_analyzed).toLocaleString() : 0}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Cluster Size:</span>
              <span className="metric-value">
                {controlCase?.cluster_summary?.total_wallets || 0} wallet
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Infrastructure Signals:</span>
              <span className="metric-value">
                {[
                  controlCase?.funder_analysis?.shared_funder_count > 0 ? 'Funder' : null,
                  controlCase?.exchange_analysis?.shared_exchange_count > 0 ? 'Exchange' : null,
                  controlCase?.proxy_analysis?.shared_proxy_count > 0 ? 'Proxy' : null
                ].filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Timing Anomaly:</span>
              <span className="metric-value">
                {controlCase?.timing_analysis?.ks_vs_uniform?.p_value < 1e-5 ? 'Detected' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="comparison-footer">
        <p className="footer-note">
          <strong>Key Insight:</strong> Theo cluster shows {theoCase?.aggregate_win_rate > controlCase?.aggregate_win_rate ? 'elevated' : 'comparable'} win rate
          ({theoCase?.aggregate_win_rate ? (theoCase.aggregate_win_rate * 100).toFixed(1) : '0.0'}% vs {controlCase?.aggregate_win_rate ? (controlCase.aggregate_win_rate * 100).toFixed(1) : '0.0'}%)
          with {theoCase?.verdict?.toLowerCase() || 'low'} statistical significance.
        </p>
      </div>
    </div>
  );
}
