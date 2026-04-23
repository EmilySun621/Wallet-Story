function AnomalyAlerts({ insights }) {
  if (!insights || insights.length === 0) return null

  // Filter for only high-priority insights and take top 3
  const topAlerts = insights
    .filter(insight => insight.emoji && (insight.emoji === '🔴' || insight.emoji === '🟡' || insight.emoji === '🟢'))
    .slice(0, 3)

  if (topAlerts.length === 0) return null

  const getSeverityColor = (emoji) => {
    if (emoji === '🔴') return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)' }
    if (emoji === '🟡') return { border: '#fbbf24', bg: 'rgba(251, 191, 36, 0.05)' }
    if (emoji === '🟢') return { border: '#4ade80', bg: 'rgba(74, 222, 128, 0.05)' }
    return { border: '#666', bg: 'rgba(102, 102, 102, 0.05)' }
  }

  return (
    <div className="chart-card">
      <h3>Top Alerts</h3>
      <div className="anomaly-alerts-container">
        {topAlerts.map((alert, index) => {
          const colors = getSeverityColor(alert.emoji)
          return (
            <div
              key={index}
              className="anomaly-alert-card"
              style={{
                borderLeftColor: colors.border,
                background: colors.bg
              }}
            >
              <div className="anomaly-alert-header">
                <span className="anomaly-alert-icon">{alert.emoji}</span>
                <span className="anomaly-alert-title">{alert.title}</span>
              </div>
              <p className="anomaly-alert-description">{alert.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AnomalyAlerts
