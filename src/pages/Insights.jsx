import InsightsComponent from '../components/Insights'

function InsightsPage({ insights }) {
  return (
    <div className="insights-page">
      <div className="insights-page-header">
        <h1>AI Insights</h1>
        <p>Deep analysis and patterns discovered in your wallet activity</p>
      </div>

      {insights.length > 0 ? (
        <div className="insights-page-content">
          <InsightsComponent insights={insights} />
        </div>
      ) : (
        <div className="insights-empty-state">
          <p>No insights available yet</p>
          <span>Analyze a wallet to see AI-generated insights</span>
        </div>
      )}
    </div>
  )
}

export default InsightsPage
