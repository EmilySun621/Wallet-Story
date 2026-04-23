import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * TimingDistributionChart — Visualize trade entry timing across market lifecycle.
 *
 * Displays a histogram of normalized trade entry times [0, 1]:
 *  - 0.0 = market open (creation)
 *  - 1.0 = market close (resolution)
 *
 * Uniform distribution (baseline) suggests no timing advantage.
 * Pre-resolution loading (spike near 1.0) suggests insider information.
 *
 * Props:
 *  - timingAnalysis: object from ForensicReport with:
 *      {
 *        normalized_times_histogram: [count_bin0, count_bin1, ...],
 *        histogram_bins: ["[0.0, 0.1)", "[0.1, 0.2)", ...],
 *        pre_resolution_load_share: float,
 *        volume_weighted_median_entry_time: float,
 *        ks_vs_uniform: {ks_statistic, p_value, n} | null,
 *        interpretation: string
 *      }
 */
export default function TimingDistributionChart({ timingAnalysis }) {
  if (!timingAnalysis) {
    return null;
  }

  const {
    normalized_times_histogram = [],
    histogram_bins = [],
    pre_resolution_load_share = 0,
    volume_weighted_median_entry_time = 0.5,
    ks_vs_uniform = null,
    total_timing_samples = 0,
    interpretation = "N/A"
  } = timingAnalysis;

  // Build chart data from histogram bins
  const chartData = histogram_bins.map((bin, idx) => ({
    bin: bin,
    binLabel: bin.replace(/[\[\)]/g, '').split(',')[0], // Extract "0.0" from "[0.0, 0.1)"
    count: normalized_times_histogram[idx] || 0,
  }));

  // If no data, show N/A message
  if (total_timing_samples === 0) {
    return (
      <div className="timing-chart-container">
        <h3>Signal 4: Timing Distribution Anomaly Detection</h3>
        <div className="timing-na-message">
          <div className="na-icon">📊</div>
          <p className="na-text">Timing Analysis Not Available</p>
          <p className="na-hint">
            {interpretation || 'No timing data available for this wallet.'}
          </p>
          <p className="na-hint">
            <strong>Note:</strong> This feature requires market lifecycle metadata.
            Historical/archived markets may not have this data available via Polymarket Gamma API.
          </p>
        </div>
      </div>
    );
  }

  // Compute expected uniform count (for reference line)
  const expectedUniform = total_timing_samples / 10;

  // Verdict styling based on interpretation
  const getVerdictClass = (interp) => {
    if (interp.startsWith("Critical")) return "verdict-critical";
    if (interp.startsWith("High")) return "verdict-high";
    if (interp.startsWith("Medium")) return "verdict-medium";
    return "verdict-low";
  };

  return (
    <div className="timing-chart-container">
      <h3>Signal 4: Timing Distribution Anomaly Detection</h3>

      <div className="timing-metrics">
        <div className="timing-metric">
          <span className="metric-label">Pre-Resolution Load (final 10%):</span>
          <span className={`metric-value ${pre_resolution_load_share > 0.5 ? 'suspicious' : ''}`}>
            {(pre_resolution_load_share * 100).toFixed(1)}%
          </span>
        </div>
        <div className="timing-metric">
          <span className="metric-label">Volume-Weighted Median Entry:</span>
          <span className={`metric-value ${volume_weighted_median_entry_time > 0.65 ? 'suspicious' : ''}`}>
            {volume_weighted_median_entry_time.toFixed(3)}
          </span>
        </div>
        {ks_vs_uniform && (
          <div className="timing-metric">
            <span className="metric-label">KS Test (vs Uniform):</span>
            <span className={`metric-value ${ks_vs_uniform.p_value < 1e-10 ? 'suspicious' : ''}`}>
              p = {ks_vs_uniform.p_value.toExponential(2)}
            </span>
          </div>
        )}
        <div className="timing-metric">
          <span className="metric-label">Samples:</span>
          <span className="metric-value">{total_timing_samples}</span>
        </div>
      </div>

      <div className="timing-chart-wrapper">
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-bar observed"></span>
            <span className="legend-label">Observed Distribution</span>
          </div>
          <div className="legend-item">
            <span className="legend-line uniform"></span>
            <span className="legend-label">Expected Uniform (10% baseline)</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
            <XAxis
              dataKey="binLabel"
              tick={{ fill: '#888', fontSize: 10 }}
              label={{ value: 'Normalized Time (0=open, 1=close)', position: 'bottom', fill: '#888', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: '#888', fontSize: 10 }}
              label={{ value: 'Trade Count', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px' }}
              labelStyle={{ color: '#888' }}
              formatter={(value, name) => {
                if (name === 'count') return [value, 'Trades'];
                return value;
              }}
            />
            {/* Reference line: expected uniform distribution */}
            <ReferenceLine
              y={expectedUniform}
              stroke="#fbbf24"
              strokeDasharray="3 3"
              label={{ value: 'Uniform Baseline', position: 'right', fill: '#fbbf24', fontSize: 10 }}
            />
            <Bar dataKey="count" fill="#a78bfa" />
          </BarChart>
        </ResponsiveContainer>

        <div className="chart-caption">
          <strong>Key Finding:</strong> {ks_vs_uniform && ks_vs_uniform.p_value < 1e-5
            ? `Non-uniform timing pattern detected (KS p < ${ks_vs_uniform.p_value < 1e-10 ? '10⁻¹⁰' : '1e-5'}). Trading activity significantly deviates from random market entry, suggesting coordinated behavior.`
            : 'Timing distribution consistent with random market entry (no significant anomaly detected).'}
        </div>
      </div>

      <div className={`timing-interpretation ${getVerdictClass(interpretation)}`}>
        <strong>Interpretation:</strong> {interpretation}
      </div>

      <div className="timing-explainer">
        <p className="explainer-text">
          <strong>What this shows:</strong> Trade entry times normalized to market lifecycle [0, 1].
          Uniform distribution = no timing advantage. Pre-resolution loading (spike near 1.0) indicates
          insider timing (Kyle 1985).
        </p>
      </div>
    </div>
  );
}
