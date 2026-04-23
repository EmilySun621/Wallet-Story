/**
 * Investigation.jsx — Main page for wallet forensic investigations
 *
 * Features:
 * - Address input with validation
 * - Loading state during investigation
 * - Results panel with verdict, p-value, cluster info
 * - Interactive force graph visualization (future)
 * - Timeline and per-wallet breakdown (future)
 */

import { useState } from 'react';
import TimingDistributionChart from '../components/TimingDistributionChart';
import '../terminal-theme.css';
import '../terminal-table.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Investigation() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progressStep, setProgressStep] = useState(0);

  // Validate Ethereum address format
  const isValidAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleInvestigate = async () => {
    setError(null);
    setResult(null);

    // Validate input
    if (!isValidAddress(address)) {
      setError('Invalid address format. Must be 0x followed by 40 hex characters.');
      return;
    }

    setLoading(true);
    setProgressStep(0);

    // Simulate multi-step progress with intervals
    const progressInterval = setInterval(() => {
      setProgressStep(prev => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 15000); // Advance every 15 seconds

    try {
      const response = await fetch(`${API_URL}/investigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      clearInterval(progressInterval);
      setProgressStep(5); // Complete

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Investigation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgressStep(0), 1000); // Reset after completion
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

  return (
    <div className="page-container">
      <div className="terminal-header">
        <h1>🔍 Wallet Investigation</h1>
        <p className="subtitle">
          Autonomous forensic analysis for prediction market insider trading detection
        </p>
      </div>

      {/* Input Section */}
      <div className="terminal-card">
        <div className="card-header">
          <h2>Enter Wallet Address</h2>
        </div>
        <div className="card-body">
          <div className="input-group">
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
              className="terminal-input"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleInvestigate()}
            />
            <button
              onClick={handleInvestigate}
              disabled={loading || !address}
              className="terminal-button"
            >
              {loading ? 'Investigating...' : 'Run Investigation'}
            </button>
          </div>
          {loading && (
            <div className="loading-message">
              <div className="progress-steps">
                <div className={`progress-step ${progressStep >= 0 ? 'active' : ''} ${progressStep > 0 ? 'completed' : ''}`}>
                  <span className="step-icon">{progressStep > 0 ? '✓' : '▶'}</span>
                  <span className="step-text">Fetching wallet history...</span>
                </div>
                <div className={`progress-step ${progressStep >= 1 ? 'active' : ''} ${progressStep > 1 ? 'completed' : ''}`}>
                  <span className="step-icon">{progressStep > 1 ? '✓' : progressStep === 1 ? '▶' : '○'}</span>
                  <span className="step-text">Classifying trades...</span>
                </div>
                <div className={`progress-step ${progressStep >= 2 ? 'active' : ''} ${progressStep > 2 ? 'completed' : ''}`}>
                  <span className="step-icon">{progressStep > 2 ? '✓' : progressStep === 2 ? '▶' : '○'}</span>
                  <span className="step-text">Computing statistics...</span>
                </div>
                <div className={`progress-step ${progressStep >= 3 ? 'active' : ''} ${progressStep > 3 ? 'completed' : ''}`}>
                  <span className="step-icon">{progressStep > 3 ? '✓' : progressStep === 3 ? '▶' : '○'}</span>
                  <span className="step-text">Building cluster graph...</span>
                </div>
                <div className={`progress-step ${progressStep >= 4 ? 'active' : ''} ${progressStep > 4 ? 'completed' : ''}`}>
                  <span className="step-icon">{progressStep > 4 ? '✓' : progressStep === 4 ? '▶' : '○'}</span>
                  <span className="step-text">Generating narrative...</span>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {result && (
        <>
          {/* Summary Card */}
          <div className="terminal-card">
            <div className="card-header">
              <h2>Forensic Report</h2>
              <span className="timestamp">{new Date(result.generated_at).toLocaleString()}</span>
            </div>
            <div className="card-body">
              {/* Large Verdict Badge */}
              <div className="verdict-section">
                <div
                  className="verdict-badge-large"
                  style={{
                    borderColor: getVerdictColor(result.insider_detection?.verdict),
                    color: getVerdictColor(result.insider_detection?.verdict)
                  }}
                >
                  <span className="verdict-icon">
                    {result.insider_detection?.verdict === 'Critical' ? '🚨' :
                     result.insider_detection?.verdict === 'High' ? '⚠️' :
                     result.insider_detection?.verdict === 'Medium' ? '⚡' :
                     result.insider_detection?.verdict === 'Low' ? '✓' : '○'}
                  </span>
                  <span className="verdict-label">VERDICT</span>
                  <span className="verdict-value">{result.insider_detection?.verdict || 'N/A'}</span>
                </div>
              </div>

              {/* Key Metrics as Stat Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Win Rate</span>
                    <span className="tooltip-icon" title="Percentage of trades that resulted in profit">?</span>
                  </div>
                  <div className="stat-value">
                    {(result.insider_detection?.win_rate * 100)?.toFixed(1) || 'N/A'}%
                  </div>
                  <div className="stat-footer">Baseline: 50%</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">p-value</span>
                    <span className="tooltip-icon" title="Statistical significance: probability this win rate occurred by chance. Lower = stronger evidence.">?</span>
                  </div>
                  <div className="stat-value stat-pvalue">
                    {result.insider_detection?.p_value < 1e-10
                      ? `< 10⁻¹⁰`
                      : result.insider_detection?.p_value?.toExponential(2) || 'N/A'}
                  </div>
                  <div className="stat-footer">
                    {result.insider_detection?.p_value < 1e-10
                      ? 'Astronomically significant'
                      : 'See interpretation'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Cluster Size</span>
                    <span className="tooltip-icon" title="Number of coordinated wallets discovered via exchange-anchor clustering">?</span>
                  </div>
                  <div className="stat-value">
                    {result.total_cluster_size || 'N/A'}
                  </div>
                  <div className="stat-footer">Related wallets</div>
                </div>

                {result.timing_analysis?.ks_vs_uniform && (
                  <div className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">KS Test</span>
                      <span className="tooltip-icon" title="Kolmogorov-Smirnov test: measures timing distribution uniformity. Low p-value = coordinated timing pattern.">?</span>
                    </div>
                    <div className="stat-value stat-pvalue">
                      {result.timing_analysis.ks_vs_uniform.p_value < 1e-10
                        ? `< 10⁻¹⁰`
                        : result.timing_analysis.ks_vs_uniform.p_value.toExponential(2)}
                    </div>
                    <div className="stat-footer">Timing anomaly</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timing Distribution Chart */}
          {result.timing_analysis && (
            <div className="terminal-card">
              <div className="card-body">
                <TimingDistributionChart timingAnalysis={result.timing_analysis} />
              </div>
            </div>
          )}

          {/* Cluster Info Card */}
          {result.cluster_info?.candidates_found > 0 && (
            <div className="terminal-card">
              <div className="card-header">
                <h2>Cluster Discovery</h2>
              </div>
              <div className="card-body">
                <p>
                  Found <strong>{result.cluster_info.candidates_found}</strong> related wallets
                  via exchange-anchor clustering.
                </p>
                {result.cluster_info.shared_infrastructure && (
                  <div className="infrastructure-info">
                    <h3>Shared Infrastructure</h3>
                    <table className="terminal-table">
                      <tbody>
                        <tr>
                          <td><strong>Shared Funder</strong></td>
                          <td className="mono-text">
                            {result.cluster_info.shared_infrastructure.funder || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Shared Exchange</strong></td>
                          <td className="mono-text">
                            {result.cluster_info.shared_infrastructure.exchange || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Shared Proxy</strong></td>
                          <td className="mono-text">
                            {result.cluster_info.shared_infrastructure.proxy || 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {result.cluster_info.candidates?.length > 0 && (
                  <div className="candidates-list">
                    <h3>Candidate Wallets (Top 10)</h3>
                    <ul className="mono-text">
                      {result.cluster_info.candidates.slice(0, 10).map((addr, idx) => (
                        <li key={idx}>{addr}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-Wallet Breakdown */}
          {result.per_wallet?.length > 0 && (
            <div className="terminal-card">
              <div className="card-header">
                <h2>Per-Wallet Breakdown</h2>
              </div>
              <div className="card-body">
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>Win Rate</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.per_wallet.map((wallet, idx) => (
                      <tr key={idx}>
                        <td className="mono-text">{wallet.address?.slice(0, 10)}...</td>
                        <td>{wallet.wins}</td>
                        <td>{wallet.losses}</td>
                        <td>{(wallet.win_rate * 100)?.toFixed(1)}%</td>
                        <td style={{ color: getVerdictColor(wallet.verdict) }}>
                          {wallet.verdict}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Methodology Footer */}
          <div className="terminal-card">
            <div className="card-body">
              <p className="methodology-note">
                <strong>Methodology:</strong> {result.methodology}
              </p>
              <p className="methodology-note">
                <strong>Agent Iterations:</strong> {result.agent_iterations}
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        .page-container {
          max-width: 1200px;
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

        .terminal-card {
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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

        .input-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .terminal-input {
          flex: 1;
          padding: 0.75rem;
          background: #000;
          border: 1px solid #333;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 1rem;
          border-radius: 4px;
        }

        .terminal-input:focus {
          outline: none;
          border-color: #00ff00;
        }

        .terminal-button {
          padding: 0.75rem 1.5rem;
          background: #00ff00;
          border: none;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .terminal-button:hover:not(:disabled) {
          background: #00cc00;
        }

        .terminal-button:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }

        .loading-message {
          color: #ffaa00;
          padding: 1.5rem;
          background: #111;
          border-radius: 4px;
          border: 1px solid #333;
        }

        .progress-steps {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #666;
          transition: all 0.3s ease;
        }

        .progress-step.active {
          color: #ffaa00;
        }

        .progress-step.completed {
          color: #00ff00;
        }

        .step-icon {
          font-size: 1rem;
          min-width: 20px;
          text-align: center;
        }

        .progress-step.active .step-icon {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .step-text {
          font-size: 0.95rem;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .spinner {
          display: inline-block;
          margin-right: 0.5rem;
        }

        .error-message {
          color: #ff4444;
          padding: 1rem;
          background: #331111;
          border: 1px solid #ff4444;
          border-radius: 4px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .verdict-section {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .verdict-badge-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 3rem;
          border: 3px solid;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          min-width: 280px;
        }

        .verdict-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .verdict-label {
          font-size: 0.9rem;
          color: #888;
          letter-spacing: 2px;
          margin-bottom: 0.25rem;
        }

        .verdict-value {
          font-size: 2.5rem;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          background: #0f0f0f;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1.25rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stat-label {
          color: #888;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #333;
          color: #888;
          border-radius: 50%;
          font-size: 0.75rem;
          cursor: help;
          transition: all 0.2s ease;
        }

        .tooltip-icon:hover {
          background: #00ff00;
          color: #000;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #00ff00;
          margin-bottom: 0.5rem;
          font-family: 'Courier New', monospace;
        }

        .stat-value.stat-pvalue {
          font-size: 1.5rem;
        }

        .stat-footer {
          color: #666;
          font-size: 0.8rem;
        }

        .result-item {
          text-align: center;
        }

        .result-item label {
          display: block;
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .verdict-badge {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .metric {
          font-size: 1.5rem;
          color: #00ff00;
        }

        .infrastructure-info,
        .candidates-list {
          margin-top: 1.5rem;
        }

        .infrastructure-info h3,
        .candidates-list h3 {
          color: #00ff00;
          margin-bottom: 1rem;
        }

        .mono-text {
          font-family: 'Courier New', monospace;
          color: #00ff00;
        }

        .candidates-list ul {
          list-style: none;
          padding: 0;
        }

        .candidates-list li {
          padding: 0.5rem;
          background: #111;
          margin-bottom: 0.25rem;
          border-left: 2px solid #00ff00;
        }

        .methodology-note {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        /* Timing Chart Styles */
        .timing-chart-container {
          padding: 1rem 0;
        }

        .timing-chart-container h3 {
          color: #00ff00;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .timing-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #111;
          border-radius: 4px;
        }

        .timing-metric {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .timing-metric .metric-label {
          color: #888;
          font-size: 0.85rem;
        }

        .timing-metric .metric-value {
          color: #00ff00;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .timing-metric .metric-value.suspicious {
          color: #ff8800;
        }

        .timing-chart-wrapper {
          margin: 1.5rem 0;
        }

        .timing-interpretation {
          padding: 1rem;
          margin: 1.5rem 0;
          border-radius: 4px;
          background: #111;
          border-left: 4px solid #888;
        }

        .timing-interpretation.verdict-critical {
          border-left-color: #ff4444;
          background: #331111;
        }

        .timing-interpretation.verdict-high {
          border-left-color: #ff8800;
          background: #332200;
        }

        .timing-interpretation.verdict-medium {
          border-left-color: #ffaa00;
          background: #332800;
        }

        .timing-interpretation.verdict-low {
          border-left-color: #88ff00;
          background: #113311;
        }

        .timing-explainer {
          padding: 1rem;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .explainer-text {
          color: #888;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #0a0a0a;
          border-radius: 4px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-bar {
          width: 24px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-bar.observed {
          background: #a78bfa;
        }

        .legend-line {
          width: 24px;
          height: 2px;
          border-top: 2px dashed #fbbf24;
        }

        .legend-label {
          color: #ccc;
          font-size: 0.85rem;
        }

        .chart-caption {
          margin-top: 1rem;
          padding: 1rem;
          background: #0f0f0f;
          border-left: 3px solid #a78bfa;
          color: #ccc;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .chart-caption strong {
          color: #a78bfa;
        }

        .timing-na-message {
          padding: 3rem 2rem;
          text-align: center;
          background: #111;
          border-radius: 8px;
          border: 1px dashed #333;
        }

        .na-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .na-text {
          color: #ffaa00;
          font-size: 1.3rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }

        .na-hint {
          color: #888;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }

        .na-hint strong {
          color: #00ff00;
        }
      `}</style>
    </div>
  );
}

export default Investigation;
