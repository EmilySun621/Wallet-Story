/**
 * CaseLibrary.jsx — Featured case studies from forensic investigations
 * V2 with Control Case added
 *
 * Features:
 * - List of notable cases
 * - Theo case as featured investigation
 * - Control case showing legitimate trader (Medium verdict)
 * - Data fetched from /case/theo and /case/control endpoints
 */

import { useEffect, useState } from 'react';
import '../terminal-theme.css';
import '../terminal-table.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function CaseLibrary() {
  const [theoCase, setTheoCase] = useState(null);
  const [controlCase, setControlCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch Theo case
      const theoResponse = await fetch(`${API_URL}/case/theo`);
      if (theoResponse.ok) {
        const theoData = await theoResponse.json();
        setTheoCase(theoData);
      }

      // Fetch control case (load from local file if API not available)
      try {
        const controlResponse = await fetch('/examples/case_polymarket_control.json');
        if (controlResponse.ok) {
          const controlData = await controlResponse.json();
          setControlCase(controlData);
        }
      } catch {
        // Control case API not implemented yet, silently fail
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    const colors = {
      Critical: '#ff4444',
      High: '#ff8800',
      Medium: '#ffaa00',
      Low: '#88ff00',
      Inconclusive: '#888888',
    };
    return colors[verdict] || '#888888';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="terminal-header">
        <h1>📚 Case Library</h1>
        <p className="subtitle">Featured forensic investigations of insider trading</p>
      </div>

      {loading && (
        <div className="loading-card">
          <span className="spinner">⏳</span> Loading case studies...
        </div>
      )}

      {error && (
        <div className="error-card">
          <div className="error-icon-large">❌</div>
          <div className="error-title-large">Failed to Load Case Studies</div>
          <div className="error-message-text">{error}</div>
          <button onClick={fetchCases} className="retry-button">
            🔄 Retry Loading
          </button>
        </div>
      )}

      {/* Featured Case: Theo Cluster */}
      {theoCase && (
        <div className="featured-case">
          <div className="featured-badge">⭐ FEATURED CASE</div>

          <div className="terminal-card">
            <div className="card-header">
              <h2>{theoCase.case_name}</h2>
              <span className="timestamp">
                {new Date(theoCase.generated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="card-body">
              {/* Case Summary */}
              <div className="case-summary">
                <p className="case-description">
                  In November 2024, Bloomberg and Chainalysis exposed a French trader who made
                  ~$85M profit on the 2024 US election using Polymarket. WalletStory independently
                  reproduced and exceeded their findings, discovering a <strong>13-wallet cluster</strong> with{' '}
                  <strong>$209M funded</strong>, <strong>$186M cashed out</strong>, and a{' '}
                  <strong>97.3% win rate</strong>.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Verdict</div>
                  <div
                    className="metric-value"
                    style={{ color: getVerdictColor(theoCase.verdict) }}
                  >
                    {theoCase.verdict}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Win Rate</div>
                  <div className="metric-value">
                    {(theoCase.aggregate_win_rate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">p-value</div>
                  <div className="metric-value">{theoCase.p_value_scientific}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Total Volume</div>
                  <div className="metric-value">
                    {formatCurrency(theoCase.total_usdc_volume)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Trades Analyzed</div>
                  <div className="metric-value">{theoCase.total_trades_analyzed.toLocaleString()}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Unique Markets</div>
                  <div className="metric-value">{theoCase.unique_markets}</div>
                </div>
              </div>

              {/* Cluster Analysis */}
              {theoCase.exchange_anchor_analysis && (
                <div className="cluster-section">
                  <h3>🕸️ Cluster Analysis</h3>
                  <div className="cluster-stats">
                    <div className="stat">
                      <strong>Total Cluster Size:</strong>{' '}
                      {theoCase.exchange_anchor_analysis.total_cluster_size} wallets
                    </div>
                    <div className="stat">
                      <strong>Candidates Surfaced:</strong>{' '}
                      {theoCase.exchange_anchor_analysis.candidates_surfaced?.length || 0}
                    </div>
                    <div className="stat">
                      <strong>Shared Infrastructure:</strong> Funder + Exchange + Proxy
                    </div>
                  </div>

                  <table className="terminal-table">
                    <thead>
                      <tr>
                        <th>Signal</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Shared Funder</td>
                        <td className="mono-text">
                          {theoCase.exchange_anchor_analysis.shared_funder}
                        </td>
                      </tr>
                      <tr>
                        <td>Shared Exchange</td>
                        <td className="mono-text">
                          {theoCase.exchange_anchor_analysis.exchange_deposit}
                        </td>
                      </tr>
                      <tr>
                        <td>Shared Proxy</td>
                        <td className="mono-text">
                          {theoCase.exchange_anchor_analysis.shared_proxy || 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Per-Wallet Breakdown */}
              {theoCase.per_wallet && theoCase.per_wallet.length > 0 && (
                <div className="wallet-section">
                  <h3>💼 Seed Wallets</h3>
                  <table className="terminal-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Address</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win Rate</th>
                        <th>Verdict</th>
                        <th>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {theoCase.per_wallet.map((wallet, idx) => (
                        <tr key={idx}>
                          <td>{wallet.username}</td>
                          <td className="mono-text">{wallet.address.slice(0, 10)}...</td>
                          <td>{wallet.wins.toLocaleString()}</td>
                          <td>{wallet.losses}</td>
                          <td>{(wallet.win_rate * 100).toFixed(1)}%</td>
                          <td style={{ color: getVerdictColor(wallet.verdict) }}>
                            {wallet.verdict}
                          </td>
                          <td>{formatCurrency(wallet.total_usdc_volume)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cross-References */}
              {theoCase.cross_reference_sources && (
                <div className="references-section">
                  <h3>📰 Cross-References</h3>
                  <ul>
                    {theoCase.cross_reference_sources.map((source, idx) => (
                      <li key={idx}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Case: Legitimate Trader */}
      {controlCase && (
        <div className="control-case">
          <div className="control-badge">✅ CONTROL CASE — Legitimate Trader</div>

          <div className="terminal-card control-card">
            <div className="card-header">
              <h2>{controlCase.case_name}</h2>
              <span className="timestamp">
                {new Date(controlCase.generated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="card-body">
              {/* Case Summary */}
              <div className="case-summary control-summary">
                <p className="case-description">
                  {controlCase.rationale}
                </p>
              </div>

              {/* Comparison Metrics */}
              <div className="comparison-section">
                <h3>📊 Theo vs. Control Comparison</h3>
                <table className="terminal-table comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Theo Cluster (Insider)</th>
                      <th>Control (Legitimate)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Win Rate</td>
                      <td style={{ color: '#ff4444' }}>
                        {controlCase.comparison_to_theo?.theo_win_rate
                          ? (controlCase.comparison_to_theo.theo_win_rate * 100).toFixed(1) + '%'
                          : '97.3%'}
                      </td>
                      <td style={{ color: '#ffaa00' }}>
                        {(controlCase.aggregate_win_rate * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td>p-value</td>
                      <td style={{ color: '#ff4444' }}>
                        {controlCase.comparison_to_theo?.theo_p_value || '< 1e-300'}
                      </td>
                      <td style={{ color: '#ffaa00' }}>
                        {controlCase.p_value_scientific}
                      </td>
                    </tr>
                    <tr>
                      <td>Verdict</td>
                      <td style={{ color: '#ff4444', fontWeight: 'bold' }}>
                        {controlCase.comparison_to_theo?.theo_verdict || 'Critical'}
                      </td>
                      <td style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                        {controlCase.verdict}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Volume</td>
                      <td>{formatCurrency(15440961.77)}</td>
                      <td>{formatCurrency(controlCase.total_usdc_volume)}</td>
                    </tr>
                    <tr>
                      <td>Markets Traded</td>
                      <td>15 (concentrated)</td>
                      <td>{controlCase.unique_markets} (diversified)</td>
                    </tr>
                  </tbody>
                </table>

                <div className="interpretation-box">
                  <p><strong>Interpretation:</strong> {controlCase.comparison_to_theo?.interpretation}</p>
                </div>
              </div>

              {/* Control Stats */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Verdict</div>
                  <div
                    className="metric-value"
                    style={{ color: getVerdictColor(controlCase.verdict) }}
                  >
                    {controlCase.verdict}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Win Rate</div>
                  <div className="metric-value">
                    {(controlCase.aggregate_win_rate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">p-value</div>
                  <div className="metric-value">{controlCase.p_value_scientific}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Total Trades</div>
                  <div className="metric-value">{controlCase.total_trades_analyzed}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Markets</div>
                  <div className="metric-value">{controlCase.unique_markets}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Volume</div>
                  <div className="metric-value">
                    {formatCurrency(controlCase.total_usdc_volume)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for Future Cases */}
      <div className="terminal-card">
        <div className="card-header">
          <h2>More Cases Coming Soon...</h2>
        </div>
        <div className="card-body">
          <p style={{ color: '#888', textAlign: 'center' }}>
            Additional case studies will be added as new investigations are completed.
          </p>
        </div>
      </div>

      <style>{`
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .terminal-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .terminal-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #00ff00;
        }

        .subtitle {
          color: #888;
          font-size: 1rem;
        }

        .loading-card,
        .error-card {
          padding: 2rem;
          text-align: center;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .error-card {
          border: 2px solid #ff4444;
          background: #1a0a0a;
        }

        .error-icon-large {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-title-large {
          color: #ff4444;
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 0.75rem;
        }

        .error-message-text {
          color: #ff8888;
          margin-bottom: 1.5rem;
        }

        .retry-button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #ff4444;
          border: none;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #ff6666;
        }

        .spinner {
          display: inline-block;
          margin-right: 0.5rem;
        }

        .featured-case,
        .control-case {
          position: relative;
          margin-bottom: 2rem;
        }

        .featured-case .terminal-card {
          border: 2px solid #ffaa00;
        }

        .featured-case .terminal-card:hover {
          border-color: #ffcc00;
          box-shadow: 0 0 25px rgba(255, 170, 0, 0.4);
        }

        .featured-badge {
          position: absolute;
          top: -10px;
          left: 20px;
          background: #ffaa00;
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.9rem;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(255, 170, 0, 0.5);
        }

        .control-badge {
          position: absolute;
          top: -10px;
          left: 20px;
          background: #00ff00;
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.9rem;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 255, 0, 0.5);
        }

        .control-card {
          border: 2px solid #00ff00 !important;
        }

        .control-card:hover {
          border-color: #00ff00 !important;
          box-shadow: 0 0 25px rgba(0, 255, 0, 0.4) !important;
        }

        .control-summary {
          border-left-color: #00ff00 !important;
        }

        .terminal-card {
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .terminal-card:hover {
          border-color: #00ff00;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
          transform: translateY(-2px);
        }

        .terminal-card:active {
          transform: translateY(0);
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
        }

        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #00ff00;
        }

        .timestamp {
          color: #888;
          font-size: 0.9rem;
        }

        .card-body {
          padding: 1.5rem;
        }

        .case-summary {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #111;
          border-left: 3px solid #00ff00;
        }

        .case-description {
          color: #ccc;
          line-height: 1.6;
          margin: 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: #111;
          padding: 1rem;
          border: 1px solid #333;
          border-radius: 4px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          background: #161616;
          border-color: #555;
          transform: scale(1.02);
        }

        .metric-label {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          color: #00ff00;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .comparison-section {
          margin-top: 2rem;
          margin-bottom: 2rem;
        }

        .comparison-section h3 {
          color: #00ff00;
          margin-bottom: 1rem;
        }

        .comparison-table td,
        .comparison-table th {
          text-align: center;
        }

        .interpretation-box {
          margin-top: 1rem;
          padding: 1rem;
          background: #111;
          border-left: 3px solid #00ff00;
          color: #ccc;
        }

        .cluster-section,
        .wallet-section,
        .references-section {
          margin-top: 2rem;
        }

        .cluster-section h3,
        .wallet-section h3,
        .references-section h3 {
          color: #00ff00;
          margin-bottom: 1rem;
        }

        .cluster-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #111;
          border-radius: 4px;
        }

        .cluster-stats .stat {
          color: #ccc;
        }

        .mono-text {
          font-family: 'Courier New', monospace;
          color: #00ff00;
          font-size: 0.9rem;
        }

        .references-section ul {
          list-style: none;
          padding: 0;
        }

        .references-section li {
          padding: 0.5rem;
          background: #111;
          margin-bottom: 0.25rem;
          border-left: 2px solid #00ff00;
          color: #ccc;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 1rem;
          }

          .terminal-header h1 {
            font-size: 2rem;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .featured-badge,
          .control-badge {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .terminal-table {
            font-size: 0.85rem;
            overflow-x: auto;
            display: block;
          }

          .mono-text {
            font-size: 0.75rem;
          }

          .cluster-stats {
            flex-direction: column;
            gap: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .terminal-header h1 {
            font-size: 1.5rem;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .metric-value {
            font-size: 1.2rem;
          }

          .comparison-table {
            font-size: 0.75rem;
          }

          .terminal-card {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .terminal-card:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export default CaseLibrary;
