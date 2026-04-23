function StatCards({ result, radarData, insights }) {
  // Calculate overall score from radar data
  const overallScore = radarData?.length > 0
    ? Math.round(radarData.reduce((sum, item) => sum + item.score, 0) / radarData.length * 10)
    : 0

  // Get grade based on score
  const getGrade = (score) => {
    if (score >= 800) return 'Elite Trader'
    if (score >= 700) return 'Power Trader'
    if (score >= 600) return 'Active Trader'
    if (score >= 400) return 'Casual User'
    return 'New Wallet'
  }

  // Count anomalies by severity
  const anomalyCount = insights?.filter(i =>
    i.emoji === '🔴' || i.emoji === '🟡' || i.emoji === '🔵'
  ).length || 0

  const stats = [
    {
      label: 'Score',
      value: `${overallScore}/1000`,
      color: '#a78bfa',
      icon: '⭐'
    },
    {
      label: 'Grade',
      value: getGrade(overallScore),
      color: '#8b5cf6',
      icon: '🏆'
    },
    {
      label: 'Anomalies',
      value: anomalyCount,
      color: anomalyCount > 5 ? '#ef4444' : anomalyCount > 2 ? '#fbbf24' : '#4ade80',
      icon: '⚠️'
    },
    {
      label: 'Risk',
      value: result?.riskLevel || 'Unknown',
      color: result?.riskLevel === 'high' ? '#ef4444' : result?.riskLevel === 'medium' ? '#fbbf24' : '#4ade80',
      icon: '🛡️'
    }
  ]

  return (
    <div className="stat-cards-row">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatCards
