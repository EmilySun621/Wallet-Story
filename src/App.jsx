import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { getTransactions, getTokenBalances, analyzeWallet, generateInsights, getWalletContext, analyzeWithContext } from './api'
import { getWalletAgents } from './api'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import Sidebar from './components/Sidebar'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import InsightsPage from './pages/Insights'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import DataSource from './pages/DataSource'
import FloatingChatbot from './components/FloatingChatbot'

function App() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rawTsx, setrawTsx] = useState([])
  const [insights, setInsights] = useState([])
  const [addressError, setAddressError] = useState('')
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])
  const [radarData, setRadarData] = useState([
    { dimension: 'Activity', score: 0 },
    { dimension: 'DeFi', score: 0 },
    { dimension: 'Risk', score: 0 },
    { dimension: 'Diversity', score: 0 },
    { dimension: 'Reputation', score: 0 }
  ])

  const saveRawTransactions = useMutation(api.transactions.saveRawTransactions)

  const validateAddress = (addr) => {
    const trimmed = addr.trim()
    if (!trimmed) {
      setAddressError('Please enter a wallet address')
      return false
    }
    if (!trimmed.startsWith('0x')) {
      setAddressError('Address must start with 0x')
      return false
    }
    if (trimmed.length !== 42) {
      setAddressError('Address must be 42 characters')
      return false
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setAddressError('Invalid address format')
      return false
    }
    setAddressError('')
    return true
  }

  const handleAnalyze = async () => {
    if (!validateAddress(address)) return

    setLoading(true)
    setAddressError('')

    try {
      // Get wallet agents (non-blocking)
      getWalletAgents(address).then(data => {
        console.log('fetch.ai agents result:', data)
      }).catch(err => console.log('Agents fetch failed:', err))

      // Get wallet information from the API
      const txs = await getTransactions(address)
      if (!txs || txs.length === 0) {
        setAddressError('No transactions found for this address')
        setLoading(false)
        return
      }

      setrawTsx(txs)
      await saveRawTransactions({
        address,
        transactions: txs.slice(0, 200).map(tx => ({
          from_address: tx.from_address ?? '',
          to_address: tx.to_address ?? '',
          value: tx.value ?? '',
          block_timestamp: tx.block_timestamp ?? '',
          gas_price: tx.gas_price ?? '',
          receipt_status: tx.receipt_status ?? '',
          hash: tx.hash ?? '',
        }))
      })

      const [analysis, insightsData, tokens] = await Promise.all([
        analyzeWallet(txs),
        generateInsights(txs),
        getTokenBalances(address)
      ])

      setResult({ ...analysis, totalTx: txs.length })
      setInsights(insightsData.insights)

      // Process pie data
      const processedPieData = tokens
        .filter(t => !t.possible_spam && t.usd_value > 0 && t.security_score > 50)
        .sort((a, b) => b.usd_value - a.usd_value)
        .slice(0, 5)
        .map(t => ({
          name: t.symbol,
          value: parseFloat(t.usd_value.toFixed(2))
        }))
      setPieData(processedPieData)

      // Process chart data
      const txsByDate = {}
      txs.slice(0, 50).forEach(tx => {
        const date = tx.block_timestamp.slice(0, 10)
        txsByDate[date] = (txsByDate[date] || 0) + 1
      })
      const processedChartData = Object.entries(txsByDate)
        .map(([date, txCount]) => ({ date, txCount }))
        .reverse()
      setChartData(processedChartData)

      // Calculate radar scores
      const activityScore = Math.min((txs.length / 100) * 100, 100)
      const defiScore = tokens.filter(t => t.symbol !== 'ETH').length * 10
      const riskScore = analysis.riskLevel === 'low' ? 90 : analysis.riskLevel === 'medium' ? 60 : 30
      const diversityScore = Math.min(processedPieData.length * 20, 100)
      const reputationScore = 75

      setRadarData([
        { dimension: 'Activity', score: Math.round(activityScore) },
        { dimension: 'DeFi', score: Math.round(Math.min(defiScore, 100)) },
        { dimension: 'Risk', score: Math.round(riskScore) },
        { dimension: 'Diversity', score: Math.round(diversityScore) },
        { dimension: 'Reputation', score: Math.round(reputationScore) }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Analysis failed:', error)
      setAddressError('Analysis failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Router>
      <div className="dashboard">
        <Sidebar />

        <div className="dashboard-content">
          <Navigation
            address={address}
            setAddress={(val) => {
              setAddress(val)
              setAddressError('')
            }}
            onAnalyze={handleAnalyze}
            loading={loading}
            addressError={addressError}
          />

          <div className="main-content">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    address={address}
                    loading={loading}
                    result={result}
                    rawTsx={rawTsx}
                    insights={insights}
                    setInsights={setInsights}
                    chartData={chartData}
                    setChartData={setChartData}
                    pieData={pieData}
                    setPieData={setPieData}
                    radarData={radarData}
                    setRadarData={setRadarData}
                  />
                }
              />
              <Route
                path="/transactions"
                element={
                  <Transactions
                    transactions={rawTsx}
                    totalCount={result?.totalTx}
                  />
                }
              />
              <Route
                path="/insights"
                element={
                  <InsightsPage insights={insights} />
                }
              />
              <Route
                path="/analytics"
                element={
                  <Analytics rawTxs={rawTsx} address={address} />
                }
              />
              <Route
                path="/reports"
                element={
                  <Reports
                    address={address}
                    result={result}
                    insights={insights}
                    chartData={chartData}
                    pieData={pieData}
                    radarData={radarData}
                    rawTxs={rawTsx}
                  />
                }
              />
              <Route
                path="/data-source"
                element={
                  <DataSource address={address} />
                }
              />
            </Routes>
          </div>
        </div>

        <FloatingChatbot />
      </div>
    </Router>
  )
}

export default App
