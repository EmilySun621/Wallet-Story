import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

function InflowOutflowChart({ rawTxs, address }) {
  const chartData = useMemo(() => {
    if (!rawTxs || rawTxs.length === 0 || !address) return []

    const normalizedAddress = address.toLowerCase()
    const weeklyData = {}

    rawTxs.forEach(tx => {
      if (!tx.block_timestamp) return

      // Get week key (YYYY-WW format)
      const date = new Date(tx.block_timestamp)
      const year = date.getFullYear()
      const weekNum = Math.ceil(
        ((date - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
      )
      const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          inflowCount: 0,
          outflowCount: 0,
          inflowValue: 0,
          outflowValue: 0
        }
      }

      const value = parseFloat(tx.value || 0) / 1e18 // Convert from wei to ETH
      const isInflow = tx.to_address?.toLowerCase() === normalizedAddress

      if (isInflow) {
        weeklyData[weekKey].inflowCount++
        weeklyData[weekKey].inflowValue += value
      } else {
        weeklyData[weekKey].outflowCount++
        weeklyData[weekKey].outflowValue += value
      }
    })

    return Object.values(weeklyData)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12) // Last 12 weeks
      .map(week => ({
        ...week,
        inflowValue: parseFloat(week.inflowValue.toFixed(4)),
        outflowValue: parseFloat(week.outflowValue.toFixed(4))
      }))
  }, [rawTxs, address])

  if (chartData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No transaction data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="week"
          tick={{ fill: '#888', fontSize: 10 }}
          tickFormatter={(value) => value.split('-W')[1]}
        />
        <YAxis tick={{ fill: '#888', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
          labelStyle={{ color: '#888' }}
          formatter={(value, name) => {
            if (name.includes('Count')) return [value, name]
            return [`${value} ETH`, name]
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        <Bar dataKey="inflowCount" fill="#10b981" name="Inflow (Count)" />
        <Bar dataKey="outflowCount" fill="#ef4444" name="Outflow (Count)" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default InflowOutflowChart
