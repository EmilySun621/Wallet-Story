function Insights({ insights }) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="insights-container">
      <h3>AI Insights</h3>
      {insights.map((insight, index) => (
        <div key={index} className="insight-card">
          <span className="insight-emoji">{insight.emoji}</span>
          <div>
            <p className="insight-title">{insight.title}</p>
            <p className="insight-description">{insight.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Insights