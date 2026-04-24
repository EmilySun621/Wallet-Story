/**
 * Investigation.jsx — Simplified wallet forensic investigation page with live streaming
 * Hero → Input → Live Activity Log → Results (VerdictBadge, 4 metrics, ClusterForceGraph, Publish button)
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import VerdictBadge from '../components/VerdictBadge';
import ClusterForceGraph from '../components/ClusterForceGraph';
import TimingDistributionChart from '../components/TimingDistributionChart';
import { attestReport, getEasscanUrl, formatAttestationUID, switchToSepolia } from '../lib/eas';
import { formatPValue } from '../lib/formatters';
import '../terminal-theme.css';
import './Investigation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Tool icons mapping
const TOOL_ICONS = {
  fetch_wallet_history: '📥',
  run_insider_detection: '📊',
  find_related_wallets: '🕸️',
  build_cluster_graph: '🔗',
  summarize_timeline: '📅',
};

// Narrative summary helper
function getNarrativeFrame(verdict) {
  const frames = {
    'Critical': 'statistically indistinguishable from certainty of insider information',
    'High': 'overwhelmingly unlikely by chance alone',
    'Medium': 'significantly above random, but not conclusive',
    'Low': 'consistent with a skilled but non-insider trader',
    'Baseline': 'consistent with a skilled but non-insider trader',
  };
  return frames[verdict] || 'inconclusive';
}

function Investigation() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const activityLogRef = useRef(null);

  // Attestation state
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationError, setAttestationError] = useState(null);
  const [attestationUID, setAttestationUID] = useState(null);

  // Cache state and helpers
  const CACHE_KEY = 'walletstory_cache_v1';
  const CACHE_MAX_ENTRIES = 20;
  const [fromCache, setFromCache] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeCache = (entries) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('localStorage write failed', e);
    }
  };

  const getCached = (addr) => {
    if (!addr) return null;
    const entries = readCache();
    return entries[addr.toLowerCase()] || null;
  };

  const saveCached = (addr, resultData, logEntries) => {
    const entries = readCache();
    entries[addr.toLowerCase()] = {
      address: addr,
      result: resultData,
      activityLog: logEntries,
      timestamp: Date.now(),
    };
    const sorted = Object.entries(entries).sort((a, b) => b[1].timestamp - a[1].timestamp);
    writeCache(Object.fromEntries(sorted.slice(0, CACHE_MAX_ENTRIES)));
  };

  // Auto-scroll activity log to bottom
  useEffect(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight;
    }
  }, [activityLog]);

  // Validate Ethereum address format
  const isValidAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleAgentEvent = (eventName, data) => {
    const timestamp = Date.now();

    if (eventName === 'start') {
      setActivityLog([{
        id: `start-${timestamp}`,
        timestamp,
        type: 'start',
        icon: '🚀',
        text: `Starting investigation of ${data.address.slice(0, 12)}...`,
        status: 'done'
      }]);
    }
    else if (eventName === 'iteration') {
      // Mark previous iteration as done
      setActivityLog(prev => prev.map(entry =>
        entry.type === 'iteration' && entry.status === 'running'
          ? { ...entry, status: 'done' }
          : entry
      ));

      // Add new iteration
      setActivityLog(prev => [...prev, {
        id: `iter-${timestamp}`,
        timestamp,
        type: 'iteration',
        icon: '🔄',
        text: `Iteration ${data.n}/${data.max}`,
        status: 'running'
      }]);
    }
    else if (eventName === 'reasoning') {
      // Truncate long reasoning text
      const text = data.text.length > 200 ? data.text.slice(0, 200) + '...' : data.text;
      setActivityLog(prev => [...prev, {
        id: `reason-${timestamp}`,
        timestamp,
        type: 'reasoning',
        icon: '💭',
        text,
        detail: data.text, // Full text for hover/click
        status: 'done'
      }]);
    }
    else if (eventName === 'tool_call') {
      const icon = TOOL_ICONS[data.tool] || '🔧';
      const inputStr = JSON.stringify(data.input).slice(0, 50);
      setActivityLog(prev => [...prev, {
        id: `tool-${data.tool}-${timestamp}`,
        timestamp,
        type: 'tool_call',
        tool: data.tool,
        icon,
        text: `${data.tool}(${inputStr}...)`,
        status: 'running'
      }]);
    }
    else if (eventName === 'tool_result') {
      // Find matching tool_call and update it
      setActivityLog(prev => prev.map(entry =>
        entry.type === 'tool_call' &&
        entry.tool === data.tool &&
        entry.status === 'running'
          ? {
              ...entry,
              status: data.ok ? 'done' : 'error',
              durationMs: data.duration_ms,
              summary: data.summary
            }
          : entry
      ));
    }
    else if (eventName === 'complete') {
      // Mark final iteration as done
      setActivityLog(prev => prev.map(entry =>
        entry.status === 'running' ? { ...entry, status: 'done' } : entry
      ));

      // Add complete marker
      setActivityLog(prev => [...prev, {
        id: `complete-${timestamp}`,
        timestamp,
        type: 'complete',
        icon: '✅',
        text: 'Investigation complete',
        status: 'done'
      }]);

      setResult(data);
      setLoading(false);

      // Snapshot the current activityLog and persist alongside the result
      setActivityLog(prev => {
        saveCached(address.trim(), data, prev);
        return prev;
      });
    }
    else if (eventName === 'error') {
      setActivityLog(prev => [...prev, {
        id: `error-${timestamp}`,
        timestamp,
        type: 'error',
        icon: '❌',
        text: data.message,
        status: 'error'
      }]);
      setError(data.message);
      setLoading(false);
    }
  };

  const handleInvestigate = async () => {
    setResult(null);
    setAttestationUID(null);
    setError(null);
    setActivityLog([]);

    if (!address.trim()) {
      setError('Please enter a wallet address.');
      return;
    }

    if (!isValidAddress(address.trim())) {
      setError('Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.');
      return;
    }

    // Cache check — serve instantly if we have a stored result and user didn't request a fresh run
    const cached = getCached(address.trim());
    if (cached && !forceRefresh) {
      setActivityLog(cached.activityLog || []);
      setResult(cached.result);
      setFromCache(true);
      setError(null);
      return;
    }
    setFromCache(false);
    setForceRefresh(false);

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/investigate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events end with \n\n
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();  // keep incomplete tail

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;

          const lines = chunk.split('\n');
          let eventName = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              data += line.slice(6);
            }
          }

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            handleAgentEvent(eventName, parsed);

            // Stop on complete or error
            if (eventName === 'complete' || eventName === 'error') {
              break;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, data);
          }
        }
      }
    } catch (err) {
      setError(err.message);
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

      // Quiet user rejections - don't show error UI for user-initiated cancellations
      const isUserRejection =
        err.message?.toLowerCase().includes('rejected') ||
        err.message?.toLowerCase().includes('user denied') ||
        err.code === 4001 ||
        err.code === 'ACTION_REJECTED';

      if (isUserRejection) {
        console.log('[Investigation] User rejected transaction - no error shown');
        // Just reset loading state, don't set error
      } else if (err.message?.includes('Wrong network')) {
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
          const isRetryRejection =
            retryErr.message?.toLowerCase().includes('rejected') ||
            retryErr.message?.toLowerCase().includes('user denied') ||
            retryErr.code === 4001 ||
            retryErr.code === 'ACTION_REJECTED';
          if (!isRetryRejection) {
            setAttestationError(retryErr.message);
          }
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

          {/* Quick-select chips */}
          <div className="quick-select-block">
            <p className="quick-select-label">
              Not sure where to start? Try a known case:
            </p>
            <div className="quick-select-chips">
              <button
                className="quick-select-chip chip-critical"
                onClick={() => setAddress('0x56687bf447db6ffa42ffe2204a05edaa20f55839')}
              >
                <span className="chip-icon">🎯</span>
                <span className="chip-name">Theo4</span>
                <span className="chip-verdict">Critical</span>
              </button>
              <button
                className="quick-select-chip chip-critical"
                onClick={() => setAddress('0x1f2dd6d473f3e824cd2f8a89d9c69fb96f6ad0cf')}
              >
                <span className="chip-icon">📊</span>
                <span className="chip-name">Fredi9999</span>
                <span className="chip-verdict">Critical</span>
              </button>
              <button
                className="quick-select-chip chip-low"
                onClick={() => setAddress('0x006cc834cc092684f1b56626e23bedb3835c16ea')}
              >
                <span className="chip-icon">✅</span>
                <span className="chip-name">Control wallet</span>
                <span className="chip-verdict">Low</span>
              </button>
            </div>

            {/* Recent investigations history panel */}
            {Object.keys(readCache()).length > 0 && (
              <div className="recent-investigations">
                <p className="recent-label">Recent investigations (from this browser):</p>
                <div className="recent-chips">
                  {Object.entries(readCache())
                    .sort((a, b) => b[1].timestamp - a[1].timestamp)
                    .slice(0, 6)
                    .map(([addr, entry]) => (
                      <button
                        key={addr}
                        className="recent-chip"
                        onClick={() => setAddress(entry.address)}
                        title={`Investigated ${new Date(entry.timestamp).toLocaleString()}`}
                      >
                        <span className="recent-addr">
                          {entry.address.slice(0, 8)}…{entry.address.slice(-4)}
                        </span>
                        {entry.result?.verdict && (
                          <span className={`recent-verdict recent-verdict-${entry.result.verdict.toLowerCase()}`}>
                            {entry.result.verdict}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Duration notice */}
          <p className="duration-notice">
            <span className="duration-icon">⏱</span>
            Analysis takes <strong>60–90 seconds</strong> for fresh wallets.
            Previously investigated wallets (including Theo4, Fredi9999, Control after first run)
            load instantly from local cache. First request may take an extra 30s if our
            backend is cold-starting.
          </p>
        </div>
      </section>

      {/* LIVE ACTIVITY LOG */}
      {activityLog.length > 0 && (
        <section className="agent-activity-section">
          <div className="agent-activity-log" ref={activityLogRef}>
            {activityLog.map((entry) => (
              <div
                key={entry.id}
                className={`activity-entry activity-entry-${entry.status}`}
                title={entry.detail || entry.text}
              >
                <span className="activity-icon">{entry.icon}</span>
                <span className="activity-text">
                  {entry.type === 'reasoning' ? (
                    <ReactMarkdown
                      children={entry.text}
                      allowedElements={['strong', 'em', 'code', 'br', 'p']}
                      unwrapDisallowed={true}
                      components={{
                        p: ({children}) => <>{children}</>,
                      }}
                    />
                  ) : (
                    entry.text
                  )}
                </span>
                {entry.durationMs && (
                  <span className="activity-duration">
                    {entry.status === 'done' ? '✓ ' : ''}
                    {(entry.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
                {entry.summary && (
                  <div className="activity-summary">{entry.summary}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* C. RESULTS SECTION */}
      {result && !loading && (
        <section className="results-section">
          {/* Cache Indicator */}
          {fromCache && (
            <div className="cached-indicator">
              <span>✓ Loaded from cache</span>
              <button
                className="cached-rerun"
                onClick={() => {
                  setForceRefresh(true);
                  setFromCache(false);
                  handleInvestigate();
                }}
              >
                Run fresh
              </button>
            </div>
          )}

          {/* Subject Address Header */}
          <div className="subject-header">
            <div className="subject-label">Subject:</div>
            <div className="subject-address">
              {result.seed_address}
              <button
                className="copy-icon"
                onClick={() => navigator.clipboard.writeText(result.seed_address)}
                title="Copy address"
              >
                📋
              </button>
            </div>
            <div className="subject-links">
              <a
                href={`https://polygonscan.com/address/${result.seed_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="subject-link"
              >
                ↗ View on Polygonscan
              </a>
              <a
                href={`https://polymarket.com/profile/${result.seed_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="subject-link"
              >
                ↗ View on Polymarket
              </a>
            </div>
          </div>

          {/* Fallback for old case data without seed_wallet_detection */}
          {(() => {
            const seedData = result.seed_wallet_detection || result.insider_detection || {};
            return (
              <>
                {/* Big centered VerdictBadge */}
                <div className="results-verdict-hero">
                  <VerdictBadge
                    severity={result.insider_detection?.verdict || 'UNKNOWN'}
                    pValue={result.insider_detection?.p_value}
                  />
                </div>

                {/* Narrative Summary */}
                <div className="narrative-summary">
                  {result.total_cluster_size > 1 ? (
                    <>
                      Your queried wallet won {seedData?.wins || 0} of {seedData?.total_trades || 0} trades ({((seedData?.win_rate || 0) * 100).toFixed(1)}%).
                      The coordinated cluster of {result.total_cluster_size} wallets collectively won {result.insider_detection?.wins || 0} of {result.insider_detection?.total_trades || 0} trades ({((result.insider_detection?.win_rate || 0) * 100).toFixed(1)}%).
                      Under the null hypothesis of random chance (50% baseline), the cluster outcome has probability p = {formatPValue(result.insider_detection?.p_value, result.insider_detection?.p_value_scientific)} — {getNarrativeFrame(result.insider_detection?.verdict)}.
                    </>
                  ) : (
                    <>
                      This wallet won {seedData?.wins || 0} of {seedData?.total_trades || 0} trades ({((seedData?.win_rate || 0) * 100).toFixed(1)}%).
                      Under the null hypothesis of random chance (50% baseline), this outcome has probability p = {formatPValue(seedData?.p_value, seedData?.p_value_scientific)} — {getNarrativeFrame(seedData?.verdict)}.
                    </>
                  )}
                </div>

                {/* Queried Wallet Card */}
                <div className="wallet-stat-card">
                  <h3 className="wallet-stat-title">Your Queried Wallet</h3>
                  <div className="results-metrics-grid">
                    <div className="metric-card-large">
                      <div className="metric-label-large">Win Rate</div>
                      <div className="metric-value-large">
                        {seedData?.win_rate
                          ? `${(seedData.win_rate * 100).toFixed(1)}%`
                          : 'N/A'}
                      </div>
                      <div className="metric-footer-large">
                        {seedData?.total_trades || 0} trades
                      </div>
                    </div>

                    <div className="metric-card-large">
                      <div className="metric-label-large">p-value</div>
                      <div className="metric-value-large">
                        {formatPValue(seedData?.p_value, seedData?.p_value_scientific)}
                      </div>
                      <div className="metric-footer-large">Statistical significance</div>
                    </div>

                    <div className="metric-card-large">
                      <div className="metric-label-large">Trades</div>
                      <div className="metric-value-large">
                        {seedData?.total_trades || 0}
                      </div>
                      <div className="metric-footer-large">
                        {seedData?.wins || 0}W / {seedData?.losses || 0}L
                      </div>
                    </div>

                    <div className="metric-card-large">
                      <div className="metric-label-large">Verdict</div>
                      <div className="metric-value-large" style={{ fontSize: 'var(--text-2xl)' }}>
                        {seedData?.verdict || 'N/A'}
                      </div>
                      <div className="metric-footer-large">Individual assessment</div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Cluster Card (only if cluster_size > 1) */}
          {result.total_cluster_size > 1 && (
            <div className="wallet-stat-card">
              <h3 className="wallet-stat-title">Coordinated Cluster ({result.total_cluster_size} wallets)</h3>
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
                    {formatPValue(result.insider_detection?.p_value, result.insider_detection?.p_value_scientific)}
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
                    {result.total_cluster_size || 1}
                  </div>
                  <div className="metric-footer-large">
                    Coordinated network
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ClusterForceGraph */}
          {result.total_cluster_size > 1 && (
            <div className="viz-grid-2col">
              <div className="viz-card-large">
                <ClusterForceGraph
                  clusterData={{
                    wallets: result.cluster_info.candidates?.map((addr) => ({
                      address: addr,
                      trades: 10, // Placeholder
                      win_rate: 0.9,
                    })) || [],
                    funder: result.cluster_info.shared_infrastructure?.funder
                      ? { address: result.cluster_info.shared_infrastructure.funder }
                      : null,
                    exchange: result.cluster_info.shared_infrastructure?.exchange
                      ? { address: result.cluster_info.shared_infrastructure.exchange }
                      : null,
                    proxy: result.cluster_info.shared_infrastructure?.proxy
                      ? { address: result.cluster_info.shared_infrastructure.proxy }
                      : null,
                  }}
                />
              </div>

              <div className="viz-card-large">
                <h3 style={{ marginBottom: '1.5rem', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
                  Cluster Infrastructure
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.cluster_info.shared_infrastructure?.funder && (
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Shared Funder</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                        {result.cluster_info.shared_infrastructure.funder.slice(0, 12)}...
                      </div>
                    </div>
                  )}
                  {result.cluster_info.shared_infrastructure?.exchange && (
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Shared Exchange</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                        {result.cluster_info.shared_infrastructure.exchange.slice(0, 12)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5-Signal Forensic Checklist */}
          <div className="signals-checklist-card">
            <h3 className="signals-checklist-title">Forensic Signals Checked</h3>
            <div className="signals-list">
              {/* Signal 1: Win rate anomaly */}
              <div className={`signal-row ${(result.insider_detection?.p_value ?? 1) < 1e-5 ? 'signal-positive' : 'signal-negative'}`}>
                <span className="signal-icon">{(result.insider_detection?.p_value ?? 1) < 1e-5 ? '✓' : '✗'}</span>
                <span className="signal-name">Win rate anomaly</span>
                <span className="signal-detail">
                  {((result.insider_detection?.win_rate || 0) * 100).toFixed(1)}% win rate over {result.insider_detection?.total_trades || 0} trades, p = {formatPValue(result.insider_detection?.p_value, result.insider_detection?.p_value_scientific)}
                </span>
              </div>

              {/* Signal 2: Timing distribution anomaly */}
              <div className={`signal-row ${
                result.timing_analysis && result.timing_analysis.samples > 0 && (result.timing_analysis.ks_vs_uniform?.p_value ?? 1) < 1e-5
                  ? 'signal-positive'
                  : result.timing_analysis?.samples === 0 || !result.timing_analysis
                  ? 'signal-na'
                  : 'signal-negative'
              }`}>
                <span className="signal-icon">
                  {result.timing_analysis && result.timing_analysis.samples > 0 && (result.timing_analysis.ks_vs_uniform?.p_value ?? 1) < 1e-5
                    ? '✓'
                    : result.timing_analysis?.samples === 0 || !result.timing_analysis
                    ? '—'
                    : '✗'}
                </span>
                <span className="signal-name">Timing distribution anomaly</span>
                <span className="signal-detail">
                  {result.timing_analysis && result.timing_analysis.samples > 0
                    ? `KS test vs uniform: p = ${formatPValue(result.timing_analysis.ks_vs_uniform?.p_value, null)}, ${result.timing_analysis.samples} trades analyzed`
                    : 'Insufficient timestamp data'}
                </span>
              </div>

              {/* Signal 3: Shared funder */}
              <div className={`signal-row ${
                result.cluster_info.shared_infrastructure?.funder
                  ? 'signal-positive'
                  : result.total_cluster_size === 1
                  ? 'signal-na'
                  : 'signal-negative'
              }`}>
                <span className="signal-icon">
                  {result.cluster_info.shared_infrastructure?.funder
                    ? '✓'
                    : result.total_cluster_size === 1
                    ? '—'
                    : '✗'}
                </span>
                <span className="signal-name">Shared funder (infrastructure)</span>
                <span className="signal-detail">
                  {result.cluster_info.shared_infrastructure?.funder
                    ? result.cluster_info.shared_infrastructure.funder.slice(0, 16) + '...'
                    : result.total_cluster_size === 1
                    ? 'No related wallets discovered'
                    : 'No shared funder found'}
                </span>
              </div>

              {/* Signal 4: Shared exchange deposit */}
              <div className={`signal-row ${
                result.cluster_info.shared_infrastructure?.exchange
                  ? 'signal-positive'
                  : result.total_cluster_size === 1
                  ? 'signal-na'
                  : 'signal-negative'
              }`}>
                <span className="signal-icon">
                  {result.cluster_info.shared_infrastructure?.exchange
                    ? '✓'
                    : result.total_cluster_size === 1
                    ? '—'
                    : '✗'}
                </span>
                <span className="signal-name">Shared exchange deposit</span>
                <span className="signal-detail">
                  {result.cluster_info.shared_infrastructure?.exchange
                    ? result.cluster_info.shared_infrastructure.exchange.slice(0, 16) + '...'
                    : result.total_cluster_size === 1
                    ? 'No related wallets discovered'
                    : 'No shared exchange found'}
                </span>
              </div>

              {/* Signal 5: Shared Polymarket proxy */}
              <div className={`signal-row ${
                result.cluster_info.shared_infrastructure?.proxy
                  ? 'signal-positive'
                  : result.total_cluster_size === 1
                  ? 'signal-na'
                  : 'signal-negative'
              }`}>
                <span className="signal-icon">
                  {result.cluster_info.shared_infrastructure?.proxy
                    ? '✓'
                    : result.total_cluster_size === 1
                    ? '—'
                    : '✗'}
                </span>
                <span className="signal-name">Shared Polymarket proxy</span>
                <span className="signal-detail">
                  {result.cluster_info.shared_infrastructure?.proxy
                    ? result.cluster_info.shared_infrastructure.proxy.slice(0, 16) + '...'
                    : result.total_cluster_size === 1
                    ? 'No related wallets discovered via exchange-anchor clustering'
                    : 'No shared proxy found'}
                </span>
              </div>
            </div>
            <div className="signals-footer">
              {[
                (result.insider_detection?.p_value ?? 1) < 1e-5,
                result.timing_analysis && result.timing_analysis.samples > 0 && (result.timing_analysis.ks_vs_uniform?.p_value ?? 1) < 1e-5,
                result.cluster_info.shared_infrastructure?.funder,
                result.cluster_info.shared_infrastructure?.exchange,
                result.cluster_info.shared_infrastructure?.proxy,
              ].filter(Boolean).length} of 5 signals positive.
            </div>
          </div>

          {/* Timing Distribution Chart */}
          <div className="timing-chart-card">
            <TimingDistributionChart timingData={result.timing_analysis} />
          </div>

          {/* Publish Attestation button */}
          <div className="attestation-section">
            {!attestationUID && (
              <div className="attestation-actions">
                <button
                  className="attest-button"
                  onClick={handlePublishAttestation}
                  disabled={attestationLoading}
                >
                  {attestationLoading ? '⏳ Publishing...' : 'Publish Attestation to Chain'}
                </button>
                <a
                  href="https://sepolia.easscan.org/attestation/view/0xbb4f00be5c0e4340afe22f847b1235e8c97575e0cc06abb1919ff4af58a4e1d4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attest-view-evidence"
                >
                  View our evidence on chain →
                </a>
              </div>
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
