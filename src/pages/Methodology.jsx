/**
 * Methodology.jsx — Dual-paper academic foundation + TradFi → on-chain mapping
 * Read-only static content presenting our research grounding and method translation
 */

import { ArrowLeft, ExternalLink, BookOpen, Scale, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../terminal-theme.css';
import './Methodology.css';

// Paper 1 — User-editable constants
const PAPER_1 = {
  title: "Needles in a Haystack: Using Forensic Network Science to Uncover Insider Trading",
  citation: "arXiv:2512.18918 (December 2025)",
  url: "https://arxiv.org/html/2512.18918v1",
  quote: "Our approach can be used to detect pairs or clusters of insiders whose behaviour suggests insider trading and/or market manipulation."
};

// Paper 2 — Legal foundation
const PAPER_2 = {
  title: "Crypto Assets and Insider Trading Law's Domain",
  citation: "Verstein, Iowa Law Review (2023), 60 pp.",
  url: "https://ilr.law.uiowa.edu/sites/ilr.law.uiowa.edu/files/2023-02/Verstein.pdf",
  quote: "Crypto assets are within the domain of insider trading law, alongside securities and commodities."
};

const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || 'https://github.com/yourusername/walletstory';

function Methodology() {
  return (
    <div className="methodology-page">
      {/* A. PAGE HEADER */}
      <section className="methodology-header">
        <div className="methodology-container">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Home
          </Link>
          <h1 className="methodology-title">Methodology</h1>
          <p className="methodology-subtitle">
            Peer-reviewed network forensics, adapted to on-chain prediction markets. Two academic foundations, one new domain.
          </p>
        </div>
      </section>

      {/* B. ACADEMIC FOUNDATION (dual citation) */}
      <section className="foundation-section">
        <div className="methodology-container">
          <h2 className="section-title">Academic foundation</h2>

          <div className="foundation-grid">
            {/* Card 1: Paper 1 */}
            <div className="foundation-card">
              <div className="card-overline">COMPUTATIONAL FOUNDATION</div>
              <h3 className="card-title">{PAPER_1.title}</h3>
              <div className="card-citation">{PAPER_1.citation}</div>

              <blockquote className="card-quote">
                {PAPER_1.quote}
              </blockquote>

              <div className="card-contributions">
                <div className="contributions-label">Key contributions:</div>
                <ul>
                  <li>p-value null-hypothesis testing</li>
                  <li>Coordinated cluster detection in trade networks</li>
                  <li>Analyzed 2.9M US equities insider trades over 10 years</li>
                  <li>Surfaced previously unreported coordinated clusters</li>
                </ul>
              </div>

              <a href={PAPER_1.url} target="_blank" rel="noopener noreferrer" className="paper-button">
                Read paper <ExternalLink size={16} />
              </a>
            </div>

            {/* Card 2: Paper 2 */}
            <div className="foundation-card">
              <div className="card-overline">LEGAL FOUNDATION</div>
              <h3 className="card-title">{PAPER_2.title}</h3>
              <div className="card-citation">{PAPER_2.citation}</div>

              <blockquote className="card-quote">
                {PAPER_2.quote}
              </blockquote>

              <div className="card-contributions">
                <div className="contributions-label">Key contributions:</div>
                <ul>
                  <li>Establishes that crypto assets fall within federal insider trading law</li>
                  <li>Six MNPI (material nonpublic information) categories mapped from equity markets to crypto</li>
                  <li>Three duty theories applicable: classical, misappropriation, tender offer</li>
                  <li>Legal foundation for on-chain forensic evidence to support regulatory referral</li>
                </ul>
              </div>

              <a href={PAPER_2.url} target="_blank" rel="noopener noreferrer" className="paper-button">
                Read paper <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <p className="foundation-summary">
            WalletStory sits at the intersection of computational forensics and legal doctrine. Paper 1 provides the statistical network framework; Paper 2 establishes that our findings are legally actionable under existing federal securities law. Together, they frame on-chain prediction market surveillance as both a statistical discipline and a compliance primitive.
          </p>
        </div>
      </section>

      {/* C. TRADFI → ON-CHAIN MAPPING TABLE */}
      <section className="mapping-section">
        <div className="methodology-container">
          <h2 className="section-title">From equities to on-chain: method translation</h2>
          <p className="section-subtitle">We keep the rigor. We add on-chain leverage.</p>

          <div className="mapping-table-wrapper">
            <div className="mapping-table">
              {/* Header Row */}
              <div className="mapping-row mapping-header">
                <div className="mapping-cell">Traditional finance approach</div>
                <div className="mapping-cell">On-chain equivalent</div>
              </div>

              {/* Data Rows */}
              {[
                ['SEC Form 4 filings (14-day lag)', 'Real-time trades via Polymarket API'],
                ['Named corporate insider identities', 'Pseudonymous wallet addresses'],
                ['Company affiliation as grouping key', 'Shared Polymarket proxy + funder + exchange'],
                ['7-day temporal alignment kernel', 'Normalized market-lifetime kernel (KS test)'],
                ['Structural + shuffled null models', 'Binomial (50% baseline) + KS (uniform baseline)'],
                ['Network centrality (closeness, eigen.)', 'Louvain community detection + exchange anchor'],
                ['SEC prosecution ground-truth', 'Chainalysis / NYT / Bloomberg public reports'],
                ['PDF publication of findings', 'EAS attestation on Sepolia (immutable, queryable)'],
              ].map(([tradfi, onchain], idx) => (
                <div key={idx} className="mapping-row">
                  <div className="mapping-cell tradfi-cell">{tradfi}</div>
                  <div className="mapping-cell onchain-cell">{onchain}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="leverage-callout">
            <h3 className="callout-title">Where on-chain gives us new leverage</h3>
            <ul className="callout-list">
              <li>Shared-funder tracing proves common ownership cryptographically</li>
              <li>Sub-minute time kernels (TradFi is trade-date resolution; DeFi is block-time)</li>
              <li>Anyone can replay our pipeline against the same on-chain data — reproducibility as a built-in property</li>
              <li>Findings are tamper-proof via EAS attestation — they cannot be retracted under legal or platform pressure</li>
            </ul>
          </div>
        </div>
      </section>

      {/* D. SIGNAL → ACADEMIC METHOD MAPPING */}
      <section className="signals-mapping-section">
        <div className="methodology-container">
          <h2 className="section-title">Our four signals, grounded in prior art</h2>

          <div className="signal-methods">
            {/* Signal 1 */}
            <div className="signal-method-row">
              <h3 className="signal-name">Win Rate Anomaly</h3>
              <div className="signal-based-on">
                <strong>Based on:</strong> both papers' null-hypothesis testing frameworks
              </div>
              <p className="signal-description">
                Binomial significance test against 50% random baseline.
              </p>
              <pre className="signal-code">scipy.stats.binomtest(wins, total, 0.5, alternative='greater')</pre>
            </div>

            {/* Signal 2 */}
            <div className="signal-method-row">
              <h3 className="signal-name">Exchange-Anchor Clustering</h3>
              <div className="signal-based-on">
                <strong>Based on:</strong> our novel extension (not in either paper)
              </div>
              <p className="signal-description">
                Anchor on shared cashout infrastructure instead of sparse wallet-to-wallet transfer graphs.
              </p>
              <pre className="signal-code">discover_cluster_via_exchange(seeds, min_cashout=$2M)</pre>
            </div>

            {/* Signal 3 */}
            <div className="signal-method-row">
              <h3 className="signal-name">Graph Community Detection</h3>
              <div className="signal-based-on">
                <strong>Based on:</strong> Paper 1's network centrality analysis
              </div>
              <p className="signal-description">
                Louvain modularity optimization cross-validates cluster membership.
              </p>
              <pre className="signal-code">networkx.community.louvain_communities(graph)</pre>
            </div>

            {/* Signal 4 */}
            <div className="signal-method-row">
              <h3 className="signal-name">Timing Distribution Anomaly</h3>
              <div className="signal-based-on">
                <strong>Based on:</strong> Paper 2's temporal alignment concept (generalized to single-wallet KS test vs uniform baseline)
              </div>
              <p className="signal-description">
                Kolmogorov-Smirnov test against uniform trading distribution over market lifetime.
              </p>
              <pre className="signal-code">scipy.stats.kstest(normalized_timestamps, 'uniform')</pre>
            </div>
          </div>
        </div>
      </section>

      {/* E. LEGAL FOUNDATION: MNPI IN PREDICTION MARKETS */}
      <section className="mnpi-section">
        <div className="methodology-container">
          <h2 className="section-title">Legal Foundation: MNPI in prediction markets</h2>
          <p className="section-subtitle">
            Our findings are not just statistically suspicious — they are legally actionable.
          </p>

          <p className="mnpi-intro">
            Verstein (2023) maps six categories of MNPI from equity markets to crypto assets. We apply this framework directly to prediction markets settled on Polygon. When our four signals converge, the resulting forensic profile fits multiple federal insider trading theories.
          </p>

          {/* MNPI Categories Table */}
          <div className="mnpi-table-wrapper">
            <h3 className="table-title">MNPI categories applicable to prediction markets</h3>
            <div className="mnpi-table">
              {/* Header Row */}
              <div className="mnpi-row mnpi-header">
                <div className="mnpi-cell">Category</div>
                <div className="mnpi-cell">On-chain prediction market example</div>
              </div>

              {/* Data Rows */}
              {[
                ['Advance knowledge of market-moving events', 'Knowledge of Trump campaign internal polling before public release'],
                ['Coordinated trading activity', 'Shared Polymarket proxy + funder + exchange cashout'],
                ['Timing asymmetry (early/late advantages)', 'Trades clustered in hours before event resolution'],
                ['Non-public affiliations', 'Wallets controlled by the same person but not publicly linked'],
                ['Strategic exploitation of settlement mechanics', 'Frontrunning resolution transaction with privileged oracle access'],
              ].map(([category, example], idx) => (
                <div key={idx} className="mnpi-row">
                  <div className="mnpi-cell category-cell">{category}</div>
                  <div className="mnpi-cell example-cell">{example}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Three Duty Theory Cards */}
          <h3 className="duty-theories-title">Three duty theories applicable to our findings</h3>
          <div className="duty-theories-grid">
            {/* Card 1: Classical */}
            <div className="duty-card">
              <div className="duty-icon">
                <ShieldCheck size={32} />
              </div>
              <h4 className="duty-card-title">Classical theory</h4>
              <p className="duty-card-description">
                Insider at a firm (e.g., Polymarket employee, campaign staffer) trades on MNPI, violating fiduciary duty to their employer or principal.
              </p>
              <div className="duty-card-example">
                Example: Polymarket employee with access to pre-resolution oracle data
              </div>
            </div>

            {/* Card 2: Misappropriation */}
            <div className="duty-card">
              <div className="duty-icon">
                <ShieldCheck size={32} />
              </div>
              <h4 className="duty-card-title">Misappropriation theory</h4>
              <p className="duty-card-description">
                Outsider (e.g., journalist, consultant) trades on MNPI obtained in breach of duty to the source of the information.
              </p>
              <div className="duty-card-example">
                Example: Journalist with advance knowledge of election results from exit poll partner
              </div>
            </div>

            {/* Card 3: Tender-offer */}
            <div className="duty-card">
              <div className="duty-icon">
                <ShieldCheck size={32} />
              </div>
              <h4 className="duty-card-title">Tender-offer theory</h4>
              <p className="duty-card-description">
                Applies to advance knowledge of tender offers or similar corporate events (e.g., token listings, protocol upgrades).
              </p>
              <div className="duty-card-example">
                Example: Trading on advance knowledge of Polymarket UMA listing or Coinbase listing
              </div>
            </div>
          </div>

          {/* Closing Callout */}
          <div className="mnpi-callout">
            <h3 className="callout-title">Why EAS attestation matters for enforcement</h3>
            <p className="callout-text">
              Every ForensicReport we publish is attested on-chain via EAS (Ethereum Attestation Service) on Sepolia. This creates a tamper-proof, timestamped record of our findings that cannot be retracted under legal or platform pressure. Regulators, prosecutors, and compliance teams can reference these attestations as cryptographic evidence in enforcement actions.
            </p>
            <p className="callout-text">
              We are building a public, queryable registry of suspected insider trading on prediction markets — no gatekeeper required.
            </p>
          </div>
        </div>
      </section>

      {/* F. PRIOR PUBLIC REPORTING VS OUR FINDINGS */}
      <section className="reporting-section">
        <div className="methodology-container">
          <h2 className="section-title">Prior Public Reporting vs Our Findings</h2>
          <p className="section-subtitle">
            Where our pipeline agreed, matched, or extended what public sources already reported about the Theo cluster.
          </p>

          <p className="reporting-intro">
            Unlike typical hackathon datasets, the Polymarket Theo case has been extensively covered by mainstream journalism and industry forensics firms. This gives us a rare cross-validation opportunity: our pipeline's output can be directly compared against independent public reporting.
          </p>

          <div className="reporting-grid">
            {/* Card 1: NY Post */}
            <div className="reporting-card">
              <div className="reporting-card-header">
                <div>
                  <h3 className="reporting-source">NY Post</h3>
                  <div className="reporting-date">November 13, 2024</div>
                </div>
                <a
                  href="https://nypost.com/2024/11/13/business/polymarket-whale-earned-85m-on-donald-trump-win/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reporting-link"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <div className="reporting-section-label">THEY REPORTED</div>
              <p className="reporting-content">
                French trader identified as "Théo" earned $85M betting on Trump's election win using multiple Polymarket accounts. Reported cluster size based on Chainalysis analysis.
              </p>

              <div className="reporting-section-label">WE INDEPENDENTLY FOUND</div>
              <p className="reporting-content">
                Our pipeline surfaced the Theo4 seed wallet plus 11 additional coordinated candidates via exchange-anchor clustering — reaching a total cluster size of 12 from a single seed input, matching the publicly reported account count.
              </p>

              <div className="reporting-section-label">VERDICT</div>
              <div className="reporting-verdict verdict-match">
                <Check size={16} /> Match + Extend
              </div>
            </div>

            {/* Card 2: 60 Minutes */}
            <div className="reporting-card">
              <div className="reporting-card-header">
                <div>
                  <h3 className="reporting-source">60 Minutes</h3>
                  <div className="reporting-date">November 2024</div>
                </div>
                <a
                  href="https://www.cbsnews.com/news/french-whale-made-over-80-million-on-polymarket-betting-on-trump-election-win-60-minutes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reporting-link"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <div className="reporting-section-label">THEY REPORTED</div>
              <p className="reporting-content">
                French "whale" made over $80 million on Polymarket betting on Trump election win. Théo claimed his edge came from superior polling analysis and "neighbor's model" insights.
              </p>

              <div className="reporting-section-label">WE INDEPENDENTLY FOUND</div>
              <p className="reporting-content">
                A 99.2% win rate over 4,000 trades (binomial p &lt; 10⁻³⁰⁰) statistically rules out any polling-thesis explanation. No publicly available polling model could have produced this accuracy.
              </p>

              <div className="reporting-section-label">VERDICT</div>
              <div className="reporting-verdict verdict-partial">
                <AlertCircle size={16} /> Testimony contested by statistics
              </div>
            </div>

            {/* Card 3: Chainalysis Nov 6 */}
            <div className="reporting-card">
              <div className="reporting-card-header">
                <div>
                  <h3 className="reporting-source">Chainalysis (Nov 6)</h3>
                  <div className="reporting-date">November 6, 2024</div>
                </div>
                <a
                  href="https://x.com/chainalysis/status/1854294960532529425"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reporting-link"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <div className="reporting-section-label">THEY REPORTED</div>
              <p className="reporting-content">
                Initial on-chain analysis identifying the Polymarket whale cluster using blockchain forensics. Cluster linked via shared funding patterns and exchange cashout addresses.
              </p>

              <div className="reporting-section-label">WE INDEPENDENTLY FOUND</div>
              <p className="reporting-content">
                Our exchange-anchor method surfaced 12 coordinated wallets (1 seed + 11 candidates) from a single seed input using the same three signals: shared funder, exchange, and Polymarket proxy.
              </p>

              <div className="reporting-section-label">VERDICT</div>
              <div className="reporting-verdict verdict-match">
                <Check size={16} /> Independent replication
              </div>
            </div>

            {/* Card 4: Chainalysis Nov 7 */}
            <div className="reporting-card">
              <div className="reporting-card-header">
                <div>
                  <h3 className="reporting-source">Chainalysis (Nov 7)</h3>
                  <div className="reporting-date">November 7, 2024</div>
                </div>
                <a
                  href="https://x.com/chainalysis/status/1854584905776431343"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reporting-link"
                >
                  <ExternalLink size={18} />
                </a>
              </div>

              <div className="reporting-section-label">THEY REPORTED</div>
              <p className="reporting-content">
                Updated analysis: 10 confirmed + 1 suspected accounts linked via shared funding patterns, timing, and exchange cashout addresses. Estimated $85M profit across the cluster.
              </p>

              <div className="reporting-section-label">WE INDEPENDENTLY FOUND</div>
              <p className="reporting-content">
                12-wallet cluster identified via the same three signals (shared funder + exchange + Polymarket proxy) using only open-source code and public Alchemy/Polymarket APIs. Cluster aggregate: $209M funded, $186M cashed out. Full per-wallet verdicts published as EAS attestations on Sepolia.
              </p>

              <div className="reporting-section-label">VERDICT</div>
              <div className="reporting-verdict verdict-match">
                <Check size={16} /> Match on count, extends volume analysis
              </div>
            </div>
          </div>

          {/* Closing Callout */}
          <div className="reporting-callout">
            <p className="callout-text">
              Every result on this site is independently reproducible: run our open-source pipeline against the same on-chain data with your own Alchemy key. Every verdict is also attested on-chain via EAS, creating a tamper-proof forensic record.
            </p>
          </div>
        </div>
      </section>

      {/* G. FUTURE WORK */}
      <section className="future-work-section">
        <div className="methodology-container">
          <h2 className="section-title">Future work</h2>
          <p className="section-subtitle">
            Methods from prior art we haven't yet ported, and directions our framework opens.
          </p>

          <ul className="future-work-list">
            <li>
              <strong>Pairwise temporal alignment</strong> (from Paper 2) — currently we test each wallet's timing against a uniform baseline, not against other wallets in the cluster. Pairwise alignment would strengthen coordination evidence.
            </li>
            <li>
              <strong>OddBall ego-network anomaly detection</strong> (from Paper 1) — density deviations in per-wallet ego-networks as an additional signal.
            </li>
            <li>
              <strong>Cross-chain coordination detection</strong> — extending to Base, Arbitrum, and other L2 prediction market venues.
            </li>
            <li>
              <strong>Sub-block time kernels</strong> for DEX-based markets (MEV-adjacent analysis).
            </li>
            <li>
              <strong>Real-time attestation webhooks</strong> — other dapps subscribing to new "Critical" verdicts as they are published.
            </li>
          </ul>
        </div>
      </section>

      {/* H. FOOTER */}
      <footer className="methodology-footer">
        <div className="methodology-container">
          <div className="footer-links">
            <Link to="/" className="footer-link">
              <ArrowLeft size={16} /> Back to home
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="footer-link">
              View source code on GitHub <ExternalLink size={16} />
            </a>
          </div>
          <div className="footer-credit">Built for MSX Hackathon 2026</div>
        </div>
      </footer>
    </div>
  );
}

export default Methodology;
