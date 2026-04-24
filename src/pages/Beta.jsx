import { useState } from 'react';
import { Bot, Sparkles, Gem, Server, ExternalLink } from 'lucide-react';
import './Beta.css';

export default function Beta() {
  // Slider states
  const [confidence, setConfidence] = useState(10); // 1e-10
  const [cashout, setCashout] = useState(2000000);
  const [binCount, setBinCount] = useState(10);
  const [maxCandidates, setMaxCandidates] = useState(15);

  // Format helpers
  const formatConfidence = (val) => `1e-${val}`;
  const formatCashout = (val) => `$${(val / 1000000).toFixed(1)}M`;
  const formatBins = (val) => `${val} bins`;

  return (
    <div className="beta-page">
      {/* Hero */}
      <section className="beta-hero">
        <h1>What's next</h1>
        <p className="subtitle">
          WalletStory v1.0 ships today. Here's what's coming in v1.1 and v1.2 — preview UI, not yet functional.
        </p>
      </section>

      {/* Section 1: Model Selection */}
      <section className="beta-section">
        <div className="section-label">AI MODEL · v1.1</div>
        <h2>Choose your investigator model</h2>
        <p className="section-subtitle">
          Run the same forensic pipeline with different LLMs. Compare reasoning, cost, and latency across models.
        </p>

        <div className="model-grid">
          {/* Claude Sonnet 4.5 - Active */}
          <div className="model-card active">
            <div className="model-card-header">
              <input type="radio" name="model" checked readOnly />
              <div className="model-icon">
                <Bot size={24} />
              </div>
              <div className="model-info">
                <div className="model-name">Claude Sonnet 4.5</div>
                <div className="model-status active-badge">Active</div>
              </div>
            </div>
            <div className="model-description">
              Our production model. Superior tool-use reliability, transparent chain-of-thought reasoning, and consistent forensic analysis. Powers every investigation today.
            </div>
          </div>

          {/* GPT-5 */}
          <div className="model-card disabled">
            <div className="model-card-header">
              <input type="radio" name="model" disabled />
              <div className="model-icon">
                <Sparkles size={24} />
              </div>
              <div className="model-info">
                <div className="model-name">GPT-5</div>
                <div className="model-status coming-badge v1-1">Coming in v1.1</div>
              </div>
            </div>
            <div className="model-description">
              OpenAI's fastest frontier model. Sub-second first token — ideal for real-time prediction-market surveillance pipelines where latency matters.
            </div>
          </div>

          {/* Gemini 2.0 Pro */}
          <div className="model-card disabled">
            <div className="model-card-header">
              <input type="radio" name="model" disabled />
              <div className="model-icon">
                <Gem size={24} />
              </div>
              <div className="model-info">
                <div className="model-name">Gemini 2.0 Pro</div>
                <div className="model-status coming-badge v1-1">Coming in v1.1</div>
              </div>
            </div>
            <div className="model-description">
              Google DeepMind's multi-modal reasoning. Extended context window for analyzing long trade histories. Cross-model verdict validation.
            </div>
          </div>

          {/* Self-hosted */}
          <div className="model-card disabled">
            <div className="model-card-header">
              <input type="radio" name="model" disabled />
              <div className="model-icon">
                <Server size={24} />
              </div>
              <div className="model-info">
                <div className="model-name">Self-hosted</div>
                <div className="model-subtitle">(Ollama, vLLM)</div>
                <div className="model-status coming-badge v1-2">Coming in v1.2</div>
              </div>
            </div>
            <div className="model-description">
              Deploy WalletStory on your own GPU infrastructure. For teams with data-residency requirements, air-gapped compliance environments, or cost-sensitive large-scale scanning.
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Investigation Parameters */}
      <section className="beta-section">
        <div className="section-label">PIPELINE TUNING · v1.1</div>
        <h2>Customize detection thresholds</h2>
        <p className="section-subtitle">
          Expose every hardcoded parameter in our current pipeline.
        </p>

        <div className="params-grid">
          {/* Confidence threshold */}
          <div className="param-control">
            <div className="param-header">
              <label>Confidence threshold (p-value cutoff for Critical verdict)</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">{formatConfidence(confidence)}</div>
            <input
              type="range"
              min="1"
              max="15"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="param-slider"
            />
            <div className="param-helper">Preview only — not yet connected to pipeline</div>
          </div>

          {/* Clustering min cashout */}
          <div className="param-control">
            <div className="param-header">
              <label>Clustering min cashout</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">{formatCashout(cashout)}</div>
            <input
              type="range"
              min="500000"
              max="10000000"
              step="500000"
              value={cashout}
              onChange={(e) => setCashout(parseInt(e.target.value))}
              className="param-slider"
            />
            <div className="param-helper">Preview only — not yet connected to pipeline</div>
          </div>

          {/* Timing KS bin count */}
          <div className="param-control">
            <div className="param-header">
              <label>Timing KS bin count</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">{formatBins(binCount)}</div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={binCount}
              onChange={(e) => setBinCount(parseInt(e.target.value))}
              className="param-slider"
            />
            <div className="param-helper">Preview only — not yet connected to pipeline</div>
          </div>

          {/* Max candidates */}
          <div className="param-control">
            <div className="param-header">
              <label>Max candidates to surface</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">{maxCandidates}</div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={maxCandidates}
              onChange={(e) => setMaxCandidates(parseInt(e.target.value))}
              className="param-slider"
            />
            <div className="param-helper">Preview only — not yet connected to pipeline</div>
          </div>
        </div>
      </section>

      {/* Section 3: Visual Pipeline Builder */}
      <section className="beta-section">
        <div className="section-label">WORKFLOW BUILDER · v1.2</div>
        <h2>Drag-and-drop forensic pipelines</h2>
        <p className="section-subtitle">
          Compose custom investigations without writing Python.
        </p>

        <div className="pipeline-preview">
          <div className="pipeline-watermark">PREVIEW · COMING v1.2</div>
          <div className="pipeline-blocks">
            <div className="pipeline-block">
              <div className="block-title">Fetch</div>
              <div className="block-subtitle">trades</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-block">
              <div className="block-title">Test</div>
              <div className="block-subtitle">p-value</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-block">
              <div className="block-title">Cluster</div>
              <div className="block-subtitle">wallets</div>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-block">
              <div className="block-title">Attest</div>
              <div className="block-subtitle">on-chain</div>
            </div>
          </div>
        </div>

        <p className="pipeline-description">
          Chain any combination of forensic tools, attach custom statistical tests, export workflows as shareable templates.
        </p>

        <button className="beta-button disabled" disabled>
          Open builder
          <span className="button-tooltip">Coming soon</span>
        </button>
      </section>

      {/* Section 4: Partner API */}
      <section className="beta-section">
        <div className="section-label">COMPLIANCE API · v1.1</div>
        <h2>Integrate forensic verdicts into your platform</h2>
        <p className="section-subtitle">
          For prediction-market operators, DEXs, and compliance teams.
        </p>

        <div className="api-preview">
          <pre className="api-code-block">
            <span className="code-method">POST</span>{' '}
            <span className="code-path">/v1/investigate</span>{'\n'}
            <span className="code-header">Authorization:</span> Bearer{' '}
            <span className="code-value">&lt;your_api_key&gt;</span>
            {'\n\n'}
            {'{'}{'\n'}
            {'  '}<span className="code-key">"address"</span>:{' '}
            <span className="code-string">"0x..."</span>,{'\n'}
            {'  '}<span className="code-key">"depth"</span>:{' '}
            <span className="code-string">"full"</span>,{'\n'}
            {'  '}<span className="code-key">"webhook_url"</span>:{' '}
            <span className="code-string">"https://yourplatform.com/walletstory-callback"</span>
            {'\n'}
            {'}'}
            {'\n\n'}
            <span className="code-comment"># Response</span>{'\n'}
            {'{'}{'\n'}
            {'  '}<span className="code-key">"verdict"</span>:{' '}
            <span className="code-string">"Critical"</span>,{'\n'}
            {'  '}<span className="code-key">"p_value"</span>:{' '}
            <span className="code-number">1e-300</span>,{'\n'}
            {'  '}<span className="code-key">"cluster_size"</span>:{' '}
            <span className="code-number">12</span>,{'\n'}
            {'  '}<span className="code-key">"attestation_uid"</span>:{' '}
            <span className="code-string">"0x..."</span>,{'\n'}
            {'  '}<span className="code-key">"easscan_url"</span>:{' '}
            <span className="code-string">"https://sepolia.easscan.org/attestation/view/0x..."</span>
            {'\n'}
            {'}'}
          </pre>
        </div>

        <div className="api-features">
          <span className="feature-chip disabled">API key management</span>
          <span className="feature-chip disabled">Webhook callbacks</span>
          <span className="feature-chip disabled">Slack/Discord alerts</span>
        </div>

        <button className="beta-button disabled" disabled>
          Request API access · Coming v1.1
        </button>
      </section>

      {/* Footer CTA */}
      <section className="beta-footer">
        <p className="footer-question">Want early access to any of these features?</p>
        <a
          href="https://github.com/EmilySun621/Wallet-Story/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="github-issues-link"
        >
          Open a GitHub issue
          <ExternalLink size={16} />
        </a>
      </section>
    </div>
  );
}
