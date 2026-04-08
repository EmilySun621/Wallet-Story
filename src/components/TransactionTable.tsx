 import {useState} from 'react'


 function TransactionTable({ transactions }){
    const [filter, setFilter] = useState({
        direction: "all",
        status: "all",
        minValue: 0
    })

    if (!transactions|| transactions.length === 0) return null

    const filtered = transactions.filter(tx =>{
        // filter on directions
        if (filter.direction === 'incoming' && tx.from_address === tx.to_address) return false
        if (filter.direction === "outgoing" && tx.from_address !== tx.to_address) return false

        // filter on status
        if (filter.status === 'success' && tx.receipt_status !== '1') return false
        if (filter.status === 'failed' && tx.receipt_status === '1') return false
    
        //filter on minimum value
        const ethValue = parseFloat(tx.value) / 1e18
        if (ethValue < filter.minValue) return false

        return true
    })

      return (
    <div className="tx-table-container">
      <h3>Transaction Records</h3>
      
      {/* Selector */}
      <div className="filter-row">
        <select onChange={e => setFilter({...filter, direction: e.target.value})}>
          <option value="all">All</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>

        <select onChange={e => setFilter({...filter, status: e.target.value})}>
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>

        <input
          type="number"
          placeholder="Min ETH value"
          onChange={e => setFilter({...filter, minValue: parseFloat(e.target.value) || 0})}
        />
      </div>

      {/* Table */}
      <table className="tx-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>From</th>
            <th>To</th>
            <th>Value (ETH)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 50).map(tx => (
            <tr key={tx.hash}>
              <td>{tx.block_timestamp.slice(0, 10)}</td>
              <td>{tx.from_address.slice(0, 8)}...</td>
              <td>{tx.to_address.slice(0, 8)}...</td>
              <td>{(parseFloat(tx.value) / 1e18).toFixed(6)}</td>
              <td>{tx.receipt_status === '1' ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tx-count">Showing {Math.min(filtered.length, 50)} of {filtered.length} transactions</p>
    </div>
  )
 }

 export default TransactionTable; 