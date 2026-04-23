import { useMemo, useState } from 'react'
import TransactionVolumeTimeline from '../components/TransactionVolumeTimeline'
import ActivityHeatmap from '../components/ActivityHeatmap'
import InflowOutflowChart from '../components/InflowOutflowChart'
import DeFiProtocolChart from '../components/DeFiProtocolChart'
import AddressNetworkGraph from '../components/AddressNetworkGraph'
import { ExplanatoryChart } from '../components/ExplanatoryChart'
import { exploreWallet } from '../api'

function Analytics({ rawTxs, address }) {
  const [question, setQuestion] = useState('')
  const [exploratoryResult, setExploratoryResult] = useState(null)
  const [exploratoryLoading, setExploratoryLoading] = useState(false)
  const chartData = useMemo(() => {
    if (!rawTxs || rawTxs.length === 0) return []

    const txsByDate = {}
    rawTxs.forEach(tx => {
      if (tx.block_timestamp) {
        const date = tx.block_timestamp.slice(0, 10)
        txsByDate[date] = (txsByDate[date] || 0) + 1
      }
    })

    return Object.entries(txsByDate)
      .map(([date, txCount]) => ({ date, txCount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [rawTxs])

  const handleExplore = async () => {
    if (!question.trim() || !rawTxs || rawTxs.length === 0) return

    setExploratoryLoading(true)
    try {
      const params = await exploreWallet(question)

      let chartData = []
      if (params.queryType === 'groupByDate') {
        const byDate = {}
        rawTxs.forEach(tx => {
          const date = tx.block_timestamp.slice(0, 10)
          byDate[date] = (byDate[date] || 0) + 1
        })
        chartData = Object.entries(byDate)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, params.limit)
      } else if (params.queryType === 'groupByAddress') {
        const byAddress = {}
        rawTxs.forEach(tx => {
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
    } catch (error) {
      console.error('Explore failed:', error)
    } finally {
      setExploratoryLoading(false)
    }
  }

  return (
    <div className="analytics-page">
      {/* Exploratory Prompt Section */}
      <div className="exploratory-prompt-section">
        <ExplanatoryChart
          question={question}
          setQuestion={setQuestion}
          handleExplore={handleExplore}
          exploratoryLoading={exploratoryLoading}
          exploratoryResult={exploratoryResult}
        />
      </div>

      <div className="analytics-grid">
        {/* Row 1: Transaction Volume Timeline & Activity Heatmap */}
        <div className="analytics-card">
          <h3>Transaction Volume Timeline</h3>
          <TransactionVolumeTimeline chartData={chartData} />
        </div>

        <div className="analytics-card">
          <h3>Activity Heatmap</h3>
          <ActivityHeatmap rawTxs={rawTxs} />
        </div>

        {/* Row 2: Inflow vs Outflow & Top Interacted Addresses */}
        <div className="analytics-card">
          <h3>Inflow vs Outflow (Weekly)</h3>
          <InflowOutflowChart rawTxs={rawTxs} address={address} />
        </div>

        <div className="analytics-card">
          <h3>Top Interacted Addresses</h3>
          <DeFiProtocolChart rawTxs={rawTxs} address={address} />
        </div>

        {/* Row 3: Address Relationship Graph (Full Width) */}
        <div className="analytics-card full-width">
          <h3>Address Relationship Network</h3>
          <p className="analytics-card-subtitle">
            Interactive network showing your wallet's top connections. Drag nodes to explore.
          </p>
          <AddressNetworkGraph rawTxs={rawTxs} address={address} />
        </div>
      </div>
    </div>
  )
}

export default Analytics
