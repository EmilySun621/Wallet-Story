import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function TransactionVolumeTimeline({ chartData }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No transaction data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTxCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#888', fontSize: 11 }}
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }}
        />
        <YAxis tick={{ fill: '#888', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
          labelStyle={{ color: '#888' }}
          formatter={(value) => [value, 'Transactions']}
        />
        <Area
          type="monotone"
          dataKey="txCount"
          stroke="#a78bfa"
          fillOpacity={1}
          fill="url(#colorTxCount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default TransactionVolumeTimeline
