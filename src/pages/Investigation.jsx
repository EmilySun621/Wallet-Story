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
import '../terminal-theme.css';
import '../terminal-table.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Investigation() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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

    try {
      const response = await fetch(`${API_URL}/investigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Investigation failed');
      }

      const data = await response.json();
      setResult(data);
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
              <span className="spinner">⏳</span>
              Running autonomous agent... This may take 30-90 seconds.
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
              <h2>Investigation Results</h2>
              <span className="timestamp">{new Date(result.generated_at).toLocaleString()}</span>
            </div>
            <div className="card-body">
              <div className="results-grid">
                <div className="result-item">
                  <label>Verdict</label>
                  <div
                    className="verdict-badge"
                    style={{ color: getVerdictColor(result.insider_detection?.verdict) }}
                  >
                    {result.insider_detection?.verdict || 'N/A'}
                  </div>
                </div>
                <div className="result-item">
                  <label>Win Rate</label>
                  <div className="metric">
                    {(result.insider_detection?.win_rate * 100)?.toFixed(1) || 'N/A'}%
                  </div>
                </div>
                <div className="result-item">
                  <label>p-value</label>
                  <div className="metric">
                    {result.insider_detection?.p_value?.toExponential(2) || 'N/A'}
                  </div>
                </div>
                <div className="result-item">
                  <label>Cluster Size</label>
                  <div className="metric">{result.total_cluster_size || 'N/A'} wallets</div>
                </div>
              </div>
            </div>
          </div>

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
          padding: 1rem;
          text-align: center;
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
      `}</style>
    </div>
  );
}

export default Investigation;
