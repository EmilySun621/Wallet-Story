import './VerdictBadge.css';

/**
 * VerdictBadge — Large, color-coded forensic verdict display
 *
 * Props:
 *  - severity: "Critical" | "High" | "Medium" | "Low" | "Baseline"
 *  - pValue: number (e.g., 1.23e-45) - optional, displays in monospace
 *  - label: string - optional, custom label (default: severity)
 *  - pulse: boolean - optional, add pulse animation (default: true for Critical)
 */
export default function VerdictBadge({ severity, pValue, label, pulse }) {
  const severityClass = `verdict-${severity.toLowerCase()}`;
  const shouldPulse = pulse !== undefined ? pulse : (severity === 'Critical');

  // Format p-value for display
  const formatPValue = (p) => {
    if (p === 0 || p < 1e-250) {
      return '< 10⁻²⁵⁰';
    }
    return p.toExponential(2);
  };

  return (
    <div className={`verdict-badge ${severityClass} ${shouldPulse ? 'pulse' : ''}`}>
      <div className="verdict-label">
        {label || severity}
      </div>
      {pValue !== undefined && (
        <div className="verdict-pvalue">
          p = <span className="pvalue-mono">{formatPValue(pValue)}</span>
        </div>
      )}
    </div>
  );
}
