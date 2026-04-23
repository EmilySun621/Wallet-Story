function Insights({ insights }) {
  if (!insights || insights.length === 0) return null

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      case 'info': return '#3b82f6'
      default: return '#888'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '●'
      case 'medium': return '●'
      case 'low': return '●'
      case 'info': return '●'
      default: return '●'
    }
  }

  return (
    <div className="insights-container">
      <h3>AI Insights</h3>
      {insights.map((insight, index) => (
        <div key={index} className="insight-card">
          <span
            className="insight-indicator"
            style={{ color: getSeverityColor(insight.severity || insight.emoji) }}
          >
            {getSeverityIcon(insight.severity || insight.emoji)}
          </span>
          <div className="insight-content">
            <p className="insight-title">{insight.title}</p>
            <p className="insight-description">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Insights