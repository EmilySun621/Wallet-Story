import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function DeFiProtocolChart({ rawTxs, address }) {
  const chartData = useMemo(() => {
    if (!rawTxs || rawTxs.length === 0 || !address) return []

    const normalizedAddress = address.toLowerCase()
    const addressCounts = {}

    rawTxs.forEach(tx => {
      // Count interactions with contract addresses (not the wallet itself)
      const otherAddress = tx.from_address?.toLowerCase() === normalizedAddress
        ? tx.to_address
        : tx.from_address

      if (otherAddress && otherAddress !== normalizedAddress) {
        addressCounts[otherAddress] = (addressCounts[otherAddress] || 0) + 1
      }
    })

    // Get top 10 most interacted addresses
    return Object.entries(addressCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([addr, count]) => ({
        address: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        fullAddress: addr,
        count
      }))
  }, [rawTxs, address])

  if (chartData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No protocol interactions found</p>
      </div>
    )
  }

  const COLORS = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3', '#312e81', '#1e1b4b', '#1e3a8a']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="address"
          tick={{ fill: '#888', fontSize: 10 }}
          width={80}
        />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
          labelStyle={{ color: '#888' }}
          formatter={(value, name, props) => [value, 'Interactions']}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.fullAddress
            }
            return label
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DeFiProtocolChart
