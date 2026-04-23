import { useState } from 'react'
import TransactionTable from '../components/TransactionTable'

function Transactions({ transactions, totalCount }) {
  const [downloading, setDownloading] = useState(false)

  const downloadCSV = () => {
    if (!transactions || transactions.length === 0) return

    setDownloading(true)

    // Create CSV header
    const headers = ['Timestamp', 'From', 'To', 'Value (ETH)', 'Gas Price', 'Status', 'Hash']

    // Create CSV rows
    const rows = transactions.map(tx => [
      tx.block_timestamp || '',
      tx.from_address || '',
      tx.to_address || '',
      tx.value ? (parseFloat(tx.value) / 1e18).toFixed(6) : '0',
      tx.gas_price || '',
      tx.receipt_status === '1' ? 'Success' : 'Failed',
      tx.hash || ''
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => setDownloading(false), 1000)
  }

  const downloadJSON = () => {
    if (!transactions || transactions.length === 0) return

    setDownloading(true)

    const jsonContent = JSON.stringify(transactions, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => setDownloading(false), 1000)
  }

  return (
    <div className="transactions-page">
      <div className="transactions-page-header">
        <div className="transactions-header-left">
          <h1>Transactions</h1>
          <p className="transactions-count">
            Showing {transactions?.length || 0} transactions
            {totalCount && ` of ${totalCount} total`}
          </p>
        </div>
        <div className="transactions-header-actions">
          <button
            className="download-btn"
            onClick={downloadCSV}
            disabled={!transactions || transactions.length === 0 || downloading}
          >
            {downloading ? 'Downloading...' : 'Download CSV'}
          </button>
          <button
            className="download-btn secondary"
            onClick={downloadJSON}
            disabled={!transactions || transactions.length === 0 || downloading}
          >
            {downloading ? 'Downloading...' : 'Download JSON'}
          </button>
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        totalCount={totalCount}
      />
    </div>
  )
}

export default Transactions
