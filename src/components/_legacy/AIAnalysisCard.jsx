function AIAnalysisCard({ result }) {
  if (!result) {
    return (
      <div className="chart-card">
        <h3>AI Analysis</h3>
        <div className="analysis-empty">
          <p>Waiting for analysis...</p>
        </div>
      </div>
    )
  }

  const getRiskColor = (risk) => {
    const colors = {
      low: '#4ade80',
      medium: '#fbbf24',
      high: '#ef4444'
    }
    return colors[risk?.toLowerCase()] || '#888'
  }

  return (
    <div className="chart-card">
      <h3>AI Analysis</h3>
      <div className="analysis-content">
        <div className="analysis-row">
          <span className="analysis-label">User Type</span>
          <span className="analysis-value">{result.type || 'Unknown'}</span>
        </div>

        <div className="analysis-row">
          <span className="analysis-label">Total Transactions</span>
          <span className="analysis-value">{result.totalTx || 0}</span>
        </div>

        <div className="analysis-row">
          <span className="analysis-label">Risk Level</span>
          <span
            className="analysis-value risk-badge"
            style={{ color: getRiskColor(result.riskLevel) }}
          >
            {result.riskLevel || 'Unknown'}
          </span>
        </div>

        <div className="analysis-summary">
          {result.summary || 'No summary available'}
        </div>
      </div>
    </div>
  )
}

export default AIAnalysisCard
