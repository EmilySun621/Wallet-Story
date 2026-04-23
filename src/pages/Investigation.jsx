/**
 * Investigation.jsx — Simplified wallet forensic investigation page
 * Hero → Input → Results (VerdictBadge, 4 metrics, ClusterForceGraph, Publish button)
 */

import { useState } from 'react';
import VerdictBadge from '../components/VerdictBadge';
import ClusterForceGraph from '../components/ClusterForceGraph';
import { attestReport, getEasscanUrl, formatAttestationUID, switchToSepolia } from '../lib/eas';
import '../terminal-theme.css';
import './Investigation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Progress steps for loading state
const PROGRESS_STEPS = [
  { icon: '🔍', text: 'Fetching transaction history...' },
  { icon: '📊', text: 'Analyzing win rates and p-values...' },
  { icon: '🕸️', text: 'Identifying cluster patterns...' },
  { icon: '✅', text: 'Generating verdict...' },
];

function Investigation() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progressStep, setProgressStep] = useState(0);

  // Attestation state
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationError, setAttestationError] = useState(null);
  const [attestationUID, setAttestationUID] = useState(null);

  // Validate Ethereum address format
  const isValidAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleInvestigate = async () => {
    setResult(null);
    setAttestationUID(null);
    setError(null);

    if (!address.trim()) {
      setError('Please enter a wallet address.');
      return;
    }

    if (!isValidAddress(address.trim())) {
      setError('Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.');
      return;
    }

    setLoading(true);
    setProgressStep(0);

    try {
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setProgressStep((prev) => {
          if (prev < PROGRESS_STEPS.length - 1) return prev + 1;
          clearInterval(progressInterval);
          return prev;
        });
      }, 800);

      const response = await fetch(`${API_URL}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setProgressStep(PROGRESS_STEPS.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAttestation = async () => {
    console.log('[Investigation] handlePublishAttestation called');
    console.log('[Investigation] result:', result);
    console.log('[Investigation] address:', address);

    setAttestationLoading(true);
    setAttestationError(null);

    try {
      const reportData = {
        ...result,
        subject_address: address,
        verdict: result.insider_detection?.verdict || 'Unknown',
        p_value: result.insider_detection?.p_value ?? 0,
      };
      console.log('[Investigation] Prepared reportData:', reportData);

      const { uid, txHash } = await attestReport(reportData);
      console.log('[Investigation] ✓ Attestation successful:', { uid, txHash });
      setAttestationUID(uid);
    } catch (err) {
      console.error('[Investigation] ❌ Attestation failed:', err);

      if (err.message?.includes('Wrong network')) {
        try {
          console.log('[Investigation] Attempting to switch to Sepolia...');
          await switchToSepolia();
          const reportData = {
            ...result,
            subject_address: address,
            verdict: result.insider_detection?.verdict || 'Unknown',
            p_value: result.insider_detection?.p_value ?? 0,
          };
          const { uid, txHash } = await attestReport(reportData);
          console.log('[Investigation] ✓ Attestation successful after network switch:', { uid, txHash });
          setAttestationUID(uid);
        } catch (retryErr) {
          console.error('[Investigation] ❌ Retry failed:', retryErr);
          setAttestationError(retryErr.message);
        }
      } else {
        setAttestationError(err.message);
      }
    } finally {
      setAttestationLoading(false);
    }
  };

  return (
    <div className="investigation-page">
      {/* A. HERO */}
      <section className="input-hero-section">
        <div className="input-hero-content">
          <h1 className="input-hero-title">Investigate Any Wallet</h1>
          <p className="input-hero-subtitle">
            Run the full forensic pipeline on any address. Publish findings on-chain.
          </p>

          {/* B. INPUT SECTION */}
          <div className="input-large-group">
            <input
              type="text"
              className={`input-large ${error && !loading ? 'input-error' : ''}`}
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleInvestigate()}
              disabled={loading}
            />
            <button
              className="button-large"
              onClick={handleInvestigate}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Investigate'}
            </button>
          </div>

          {error && !loading && (
            <p className="error-message-large">{error}</p>
          )}

          {/* Loading state with progress steps */}
          {loading && (
            <div className="progress-container">
              {PROGRESS_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`progress-step-item ${
                    idx < progressStep ? 'completed' : idx === progressStep ? 'active' : ''
                  }`}
                >
                  <span className="progress-icon">{step.icon}</span>
                  <span className="progress-text">{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* C. RESULTS SECTION */}
      {result && !loading && (
        <section className="results-section">
          {/* Big centered VerdictBadge */}
          <div className="results-verdict-hero">
            <VerdictBadge
              severity={result.insider_detection?.verdict || 'UNKNOWN'}
              pValue={result.insider_detection?.p_value}
            />
          </div>

          {/* 4 metric cards */}
          <div className="results-metrics-grid">
            <div className="metric-card-large">
              <div className="metric-label-large">Win Rate</div>
              <div className="metric-value-large">
                {result.insider_detection?.win_rate
                  ? `${(result.insider_detection.win_rate * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
              <div className="metric-footer-large">
                {result.insider_detection?.total_trades || 0} trades
              </div>
            </div>

            <div className="metric-card-large">
              <div className="metric-label-large">p-value</div>
              <div className="metric-value-large">
                {result.insider_detection?.p_value_scientific || 'N/A'}
              </div>
              <div className="metric-footer-large">Statistical significance</div>
            </div>

            <div className="metric-card-large">
              <div className="metric-label-large">Trades</div>
              <div className="metric-value-large">
                {result.insider_detection?.total_trades || 0}
              </div>
              <div className="metric-footer-large">
                {result.insider_detection?.wins || 0}W / {result.insider_detection?.losses || 0}L
              </div>
            </div>

            <div className="metric-card-large">
              <div className="metric-label-large">Cluster Size</div>
              <div className="metric-value-large">
                {result.cluster_summary?.cluster_size || 1}
              </div>
              <div className="metric-footer-large">
                {result.cluster_summary?.cluster_size > 1 ? 'Coordinated network' : 'Solo wallet'}
              </div>
            </div>
          </div>

          {/* ClusterForceGraph */}
          {result.cluster_summary?.cluster_size > 1 && (
            <div className="viz-grid-2col">
              <div className="viz-card-large">
                <ClusterForceGraph
                  clusterData={{
                    wallets: result.cluster_summary.candidates?.map((addr) => ({
                      address: addr,
                      trades: 10, // Placeholder
                      win_rate: 0.9,
                    })) || [],
                    funder: result.exchange_anchor_analysis?.shared_funder
                      ? { address: result.exchange_anchor_analysis.shared_funder }
                      : null,
                    exchange: result.exchange_anchor_analysis?.exchange_deposit
                      ? { address: result.exchange_anchor_analysis.exchange_deposit }
                      : null,
                    proxy: result.exchange_anchor_analysis?.shared_proxy
                      ? { address: result.exchange_anchor_analysis.shared_proxy }
                      : null,
                  }}
                />
              </div>

              <div className="viz-card-large">
                <h3 style={{ marginBottom: '1.5rem', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                  Cluster Infrastructure
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.exchange_anchor_analysis?.shared_funder && (
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Shared Funder</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                        {result.exchange_anchor_analysis.shared_funder.slice(0, 12)}...
                      </div>
                    </div>
                  )}
                  {result.exchange_anchor_analysis?.exchange_deposit && (
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Shared Exchange</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                        {result.exchange_anchor_analysis.exchange_deposit.slice(0, 12)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Publish Attestation button */}
          <div className="attestation-section">
            {!attestationUID && (
              <button
                className="attest-button"
                onClick={handlePublishAttestation}
                disabled={attestationLoading}
              >
                {attestationLoading ? '⏳ Publishing...' : 'Publish Attestation to Chain'}
              </button>
            )}

            {attestationError && (
              <div className="attestation-error">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{attestationError}</span>
                <button
                  className="retry-button"
                  onClick={handlePublishAttestation}
                  disabled={attestationLoading}
                >
                  Retry
                </button>
              </div>
            )}

            {attestationUID && (
              <div className="attestation-success">
                <span className="success-icon">✅</span>
                <span className="success-text">
                  Attestation published: <code className="attestation-uid">{formatAttestationUID(attestationUID)}</code>
                </span>
                <a
                  href={getEasscanUrl(attestationUID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="easscan-link"
                >
                  View on EASScan →
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Investigation;
