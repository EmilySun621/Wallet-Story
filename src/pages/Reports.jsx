import { useState } from 'react'

function Reports({ address, result, insights, chartData, pieData, radarData, rawTxs }) {
  const [report, setReport] = useState(null)
  const [copied, setCopied] = useState(false)

  const generateReport = () => {
    const timestamp = new Date().toLocaleString()

    const reportText = `
═══════════════════════════════════════════════
        WALLET ANALYSIS REPORT
═══════════════════════════════════════════════

Generated: ${timestamp}
Wallet Address: ${address || 'N/A'}

───────────────────────────────────────────────
WALLET SUMMARY
───────────────────────────────────────────────

Type: ${result?.type || 'N/A'}
Risk Level: ${result?.riskLevel?.toUpperCase() || 'N/A'}
Total Transactions: ${result?.totalTx || rawTxs?.length || 0}
Chart Type: ${result?.chartType || 'N/A'}

Summary:
${result?.summary || 'No summary available'}

───────────────────────────────────────────────
WALLET SCORES
───────────────────────────────────────────────

${radarData?.map(item => `${item.dimension}: ${item.score}/100`).join('\n') || 'No score data available'}

───────────────────────────────────────────────
TOP HOLDINGS
───────────────────────────────────────────────

${pieData && pieData.length > 0
  ? pieData.map((item, idx) => `${idx + 1}. ${item.name}: $${item.value.toFixed(2)}`).join('\n')
  : 'No holdings data available'}

───────────────────────────────────────────────
TRANSACTION ACTIVITY
───────────────────────────────────────────────

${chartData && chartData.length > 0
  ? `Recent activity across ${chartData.length} time periods
Latest: ${chartData[0]?.date || 'N/A'} (${chartData[0]?.txCount || 0} transactions)`
  : 'No transaction data available'}

───────────────────────────────────────────────
KEY INSIGHTS
───────────────────────────────────────────────

${insights && insights.length > 0
  ? insights.map((insight, idx) => `${idx + 1}. [${insight.severity?.toUpperCase() || 'INFO'}] ${insight.title || insight.message || insight}`).join('\n\n')
  : 'No insights available'}

───────────────────────────────────────────────
END OF REPORT
───────────────────────────────────────────────
    `.trim()

    setReport(reportText)
  }

  const copyReport = () => {
    if (!report) return

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1>Reports</h1>
        <p>Generate comprehensive wallet analysis reports</p>
      </div>

      <div className="reports-actions">
        <button
          className="report-generate-btn"
          onClick={generateReport}
          disabled={!address}
        >
          Generate Report
        </button>

        {report && (
          <button
            className={`report-copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyReport}
          >
            {copied ? '✓ Copied!' : 'Copy Report'}
          </button>
        )}
      </div>

      {report && (
        <div className="report-card">
          <pre className="report-content">
            {report}
          </pre>
        </div>
      )}

      {!address && (
        <div className="report-empty-state">
          <p>Please analyze a wallet address first to generate a report</p>
        </div>
      )}
    </div>
  )
}

export default Reports
