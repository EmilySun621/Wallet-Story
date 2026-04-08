import { useState, useEffect } from 'react'
import './App.css'
import { getTransactions, getTokenBalances, analyzeWallet, exploreWallet, generateInsights, getWalletContext, analyzeWithContext} from './api'
import { getWalletAgents } from './api'
import ChartContainer from './components/ChartContainer'
import ResultCard from './components/Result'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { ExplanatoryChart } from './components/ExplanatoryChart'
import TransactionTable from './components/TransactionTable'
import Insights from './components/Insights'

function App() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])
  const [rawTsx, setrawTsx] = useState([])
  const [question, setQuestion] = useState('')
  const [exploratoryResult, setExploratoryResult] = useState(null)
  const [exploratoryLoading, setExploratoryLoading] = useState(false)
  const [insights, setInsights] = useState([])
  const [walletContext, setwalletContext] = useState(null)

  // use convex 
  const saveTransactions = useMutation(api.transactions.saveTransactions)
  const saveAnalysis = useMutation(api.transactions.saveAnalysis)
  const saveRawTransactions = useMutation(api.transactions.saveRawTransactions)
  const txData = useQuery(api.transactions.getTransactions, 
    address ? { address } : 'skip'
  )


  const handleAnalyze = async () => {
    console.log("click")
    setLoading(true)

    // get wallet context using Browser Use
    getWalletContext(address).then(context => {
      setwalletContext(context)
    })

    // async function to get response from multi-agent using fetch.ai framework
    // this is optional
    getWalletAgents(address).then(data => {
      console.log('fetch.ai agents result:', data)
    })


    // get wallet information from the API
    const txs = await getTransactions(address)
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

    // get wallet analysis and chart type from claude
    //const analysis = await analyzeWallet(txs)
    getTokenBalances(address).then(tokens =>{
        const pieData = tokens
        .filter(t => !t.possible_spam && t.usd_value > 0 && t.security_score > 50)
        .sort((a, b) => b.usd_value - a.usd_value)         
        .slice(0, 8)                                         
        .map(t => ({
          name: t.symbol,
          value: parseFloat(t.usd_value.toFixed(2)) 
        }))
      setPieData(pieData)
      }
    )


    const [analysis,insightsData] = await Promise.all([
      analyzeWallet(txs),
      generateInsights(txs),
    ])
    setResult({...analysis, totalTx:txs.length})
    setInsights(insightsData.insights)

    // convert chart result into rechart compatible way
    const txsByDate = {}
    txs.slice(0, 50).forEach(tx => {
      const date = tx.block_timestamp.slice(0,10)
      console.log(date)
      txsByDate[date] = (txsByDate[date] || 0) + 1
    })
    const chartResult = Object.entries(txsByDate)
      .map(([date, txCount]) => ({ date, txCount }))
      .reverse()
    console.log(chartResult)
    setChartData(chartResult)


    // save data into the convex database
    await saveTransactions({address, chartData: chartResult})
    await saveAnalysis({
      address,
      type: analysis.type,
      riskLevel: analysis.riskLevel,
      summary: analysis.summary,
      chartType: analysis.chartType,
    })

    setLoading(false)
  }

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
    } 
    
    
    else if (params.queryType === 'groupByAddress') {
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

  return (
    <div>
      <h1>WalletStory</h1>
      <p className="subtitle">Enter Wallet Address, AI reads story</p>
      <div className="input-row">
      <input
        placeholder="Enter Your Wallet Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing' : 'Analyze'}</button>
      </div>
        <ChartContainer chartData={txData ?? chartData} chartType={result?.chartType}/>
        <TransactionTable transactions={rawTsx} />
        <ChartContainer chartData={pieData} chartType="pie" />

        <ExplanatoryChart question={question} setQuestion={setQuestion} handleExplore={handleExplore} 
        exploratoryLoading={exploratoryLoading} exploratoryResult={exploratoryResult}/>

        <ResultCard result={result} />

        <Insights insights={insights} />
    </div>
  )
}

export default App