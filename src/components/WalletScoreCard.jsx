import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

function WalletScoreCard({ radarData, overallScore }) {
  // Calculate overall score from radar data if not provided
  const score = overallScore ?? (radarData?.reduce((sum, item) => sum + item.score, 0) / radarData?.length || 0)

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80'
    if (score >= 60) return '#fbbf24'
    return '#ef4444'
  }

  const scoreColor = getScoreColor(score)

  return (
    <div className="chart-card wallet-score-card">
      <h3>Wallet Score</h3>

      <div className="score-content">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: scoreColor }}>
            <div className="score-number" style={{ color: scoreColor }}>
              {Math.round(score)}
            </div>
            <div className="score-label">/ 100</div>
          </div>
        </div>

        {radarData && radarData.length > 0 && (
          <div className="radar-chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#888', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#666', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletScoreCard
