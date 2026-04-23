import { useState } from 'react'

function TransactionTable({ transactions, totalCount, showHeader = true }) {
  const [filter, setFilter] = useState({
    direction: "all",
    status: "all",
    minValue: 0
  })

  if (!transactions || transactions.length === 0) {
    return (
      <div className="transaction-table-wrapper">
        <div className="empty-state-table">
          <p>No transactions to display</p>
          <span>Enter a wallet address to begin</span>
        </div>
      </div>
    )
  }

  const filtered = transactions.filter(tx => {
    // Filter on direction
    if (filter.direction === 'incoming' && tx.from_address === tx.to_address) return false
    if (filter.direction === "outgoing" && tx.from_address !== tx.to_address) return false

    // Filter on status
    if (filter.status === 'success' && tx.receipt_status !== '1') return false
    if (filter.status === 'failed' && tx.receipt_status === '1') return false

    // Filter on minimum value
    const ethValue = parseFloat(tx.value) / 1e18
    if (ethValue < filter.minValue) return false

    return true
  })

  return (
    <div className="transaction-table-wrapper">
      <div className="table-filters">
        <select
          className="filter-select"
          onChange={e => setFilter({...filter, direction: e.target.value})}
          value={filter.direction}
        >
          <option value="all">All Directions</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>

        <select
          className="filter-select"
          onChange={e => setFilter({...filter, status: e.target.value})}
          value={filter.status}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="number"
          className="filter-input"
          placeholder="Min ETH value"
          onChange={e => setFilter({...filter, minValue: parseFloat(e.target.value) || 0})}
        />

        <div className="filter-info">
          Showing {filtered.length} {filtered.length !== transactions.length && `of ${transactions.length}`} transactions
        </div>
      </div>

      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th className="th-time">Time</th>
              <th className="th-from">From</th>
              <th className="th-to">To</th>
              <th className="th-value">Value (ETH)</th>
              <th className="th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => (
              <tr key={tx.hash}>
                <td className="time-col">{tx.block_timestamp?.slice(0, 10) || 'N/A'}</td>
                <td className="address-col">{tx.from_address?.slice(0, 6)}...</td>
                <td className="address-col">{tx.to_address?.slice(0, 6)}...</td>
                <td className="value-col">{(parseFloat(tx.value) / 1e18).toFixed(4)}</td>
                <td className="status-col">{tx.receipt_status === '1' ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionTable
