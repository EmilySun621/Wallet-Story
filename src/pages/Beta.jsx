import { Bot, Sparkles, Gem, Server, ExternalLink } from 'lucide-react';
import './Beta.css';

export default function Beta() {
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
          <div className="model-card active">
            <input type="radio" name="model" checked readOnly />
            <div className="model-icon">
              <Bot size={24} />
            </div>
            <div className="model-info">
              <div className="model-name">Claude Sonnet 4.5</div>
              <div className="model-status active-badge">Active</div>
            </div>
          </div>

          <div className="model-card disabled">
            <input type="radio" name="model" disabled />
            <div className="model-icon">
              <Sparkles size={24} />
            </div>
            <div className="model-info">
              <div className="model-name">GPT-5</div>
              <div className="model-status coming-badge v1-1">Coming in v1.1</div>
            </div>
          </div>

          <div className="model-card disabled">
            <input type="radio" name="model" disabled />
            <div className="model-icon">
              <Gem size={24} />
            </div>
            <div className="model-info">
              <div className="model-name">Gemini 2.0 Pro</div>
              <div className="model-status coming-badge v1-1">Coming in v1.1</div>
            </div>
          </div>

          <div className="model-card disabled">
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
          <div className="param-control disabled">
            <div className="param-header">
              <label>Confidence threshold (p-value cutoff for Critical verdict)</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">1e-10</div>
            <input type="range" min="0" max="100" value="20" disabled className="param-slider" />
          </div>

          <div className="param-control disabled">
            <div className="param-header">
              <label>Clustering min cashout</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">$2,000,000</div>
            <input type="range" min="0" max="100" value="30" disabled className="param-slider" />
          </div>

          <div className="param-control disabled">
            <div className="param-header">
              <label>Timing KS bin count</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">10 bins</div>
            <input type="range" min="0" max="100" value="40" disabled className="param-slider" />
          </div>

          <div className="param-control disabled">
            <div className="param-header">
              <label>Max candidates to surface</label>
              <span className="version-tag v1-1">v1.1</span>
            </div>
            <div className="param-value">15</div>
            <input type="range" min="0" max="100" value="50" disabled className="param-slider" />
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
          <pre><code>{`POST /v1/investigate
Authorization: Bearer <your_api_key>

{
  "address": "0x...",
  "depth": "full",
  "webhook_url": "https://yourplatform.com/walletstory-callback"
}

# Response
{
  "verdict": "Critical",
  "p_value": 1e-300,
  "cluster_size": 12,
  "attestation_uid": "0x...",
  "easscan_url": "https://sepolia.easscan.org/attestation/view/0x..."
}`}</code></pre>
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
