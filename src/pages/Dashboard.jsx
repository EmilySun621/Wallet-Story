import { useState, useEffect } from 'react'
import { getTokenBalances, exploreWallet, getWalletContext, analyzeWithContext } from '../api'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import ChartContainer from '../components/ChartContainer'
import SkeletonLoader from '../components/SkeletonLoader'
import StatCards from '../components/StatCards'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

function Dashboard({ address, loading, result, rawTsx, insights, setInsights, chartData, setChartData, pieData, setPieData, radarData, setRadarData }) {
  const [question, setQuestion] = useState('')
  const [exploratoryResult, setExploratoryResult] = useState(null)
  const [exploratoryLoading, setExploratoryLoading] = useState(false)
  const [walletContext, setwalletContext] = useState(null)

  const saveTransactions = useMutation(api.transactions.saveTransactions)
  const saveAnalysis = useMutation(api.transactions.saveAnalysis)
  const txData = useQuery(api.transactions.getTransactions,
    address ? { address } : 'skip'
  )

  useEffect(() => {
    if (address && rawTsx.length > 0) {
      // Get wallet context
      getWalletContext(address).then(context => {
        setwalletContext(context)
      }).catch(err => console.log('Context fetch failed:', err))

      // Save data if chartData exists
      if (chartData.length > 0) {
        saveTransactions({ address, chartData })
      }
      if (result) {
        saveAnalysis({
          address,
          type: result.type,
          riskLevel: result.riskLevel,
          summary: result.summary,
          chartType: result.chartType,
        })
      }
    }
  }, [address, rawTsx, result, chartData])

  useEffect(() => {
    if (walletContext && rawTsx.length > 0) {
      analyzeWithContext(rawTsx, walletContext).then(data => {
        setInsights(prev => [...prev, ...data.insights])
      })
    }
  }, [walletContext])

  const handleExplore = async () => {
    setExploratoryLoading(true)
    const params = await exploreWallet(question)

    let chartData = []
    if (params.queryType === 'groupByDate') {
      const byDate = {}
      rawTsx.forEach(tx => {
        const date = tx.block_timestamp.slice(0, 10)
        byDate[date] = (byDate[date] || 0) + 1
      })
      chartData = Object.entries(byDate)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, params.limit)
    } else if (params.queryType === 'groupByAddress') {
      const byAddress = {}
      rawTsx.forEach(tx => {
        const other = tx.from_address === address.toLowerCase()
          ? tx.to_address : tx.from_address
        if (other) byAddress[other] = (byAddress[other] || 0) + 1
      })
      chartData = Object.entries(byAddress)
        .map(([label, value]) => ({ label: label.slice(0, 10) + '...', value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, params.limit)
    }

    setExploratoryResult({ ...params, chartData })
    setExploratoryLoading(false)
  }

  // Get anomaly alerts with severity
  const anomalyAlerts = insights
    ?.filter(i => i.severity && ['high', 'medium', 'low', 'info'].includes(i.severity))
    .map(i => ({
      ...i,
      severityLabel: i.severity === 'high' ? 'HIGH' : i.severity === 'medium' ? 'MEDIUM' : i.severity === 'low' ? 'LOW' : 'INFO',
      borderColor: i.severity === 'high' ? '#ef4444' : i.severity === 'medium' ? '#f59e0b' : i.severity === 'low' ? '#10b981' : '#3b82f6',
      indicator: '●'
    })) || []

  return (
    <div className="dashboard-page">
      {/* Row 1: Stat Cards */}
      {loading ? (
        <div className="stat-cards-row">
          {[1, 2, 3, 4].map(i => <div key={i} className="stat-card skeleton-stat" />)}
        </div>
      ) : (
        <StatCards result={result} radarData={radarData} insights={insights} />
      )}

      {/* Row 2: Charts Side by Side */}
      <div className="dashboard-charts-row">
        {/* Left: Radar Chart */}
        <div className="dashboard-chart-card">
          <h3>Wallet Profile</h3>
          {loading ? (
            <SkeletonLoader type="chart" />
          ) : radarData && radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#888', fontSize: 12 }}
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
          ) : (
            <div className="chart-empty-state">
              <p>No data available</p>
            </div>
          )}
        </div>

        {/* Right: Pie Chart */}
        <div className="dashboard-chart-card">
          <h3>Top 5 Holdings</h3>
          {loading ? (
            <SkeletonLoader type="chart" />
          ) : (
            <ChartContainer chartData={pieData} chartType="pie" />
          )}
        </div>
      </div>

      {/* Row 3: Anomaly Alert Cards */}
      {anomalyAlerts.length > 0 && (
        <div className="anomaly-cards-horizontal">
          <h3 className="anomaly-section-title">Anomaly Alerts</h3>
          <div className="anomaly-cards-list">
            {anomalyAlerts.map((alert, index) => (
              <div
                key={index}
                className="anomaly-card-horizontal"
                style={{ borderLeftColor: alert.borderColor }}
              >
                <div className="anomaly-severity-indicator">
                  <span style={{ color: alert.borderColor }}>{alert.indicator}</span>
                  <span className="severity-label" style={{ color: alert.borderColor }}>
                    {alert.severityLabel}
                  </span>
                </div>
                <div className="anomaly-card-content">
                  <div className="anomaly-card-title">{alert.title}</div>
                  <div className="anomaly-card-description">{alert.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
