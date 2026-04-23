import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,  Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'


function ChartContainer({ chartData, chartType }) {
  const xKey = chartData[0]?.label !== undefined ? 'label' : 'date'
  const yKey = chartData[0]?.value !== undefined ? 'value' : 'txCount'
  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 10 }} />
          <YAxis tick={{ fill: '#888', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
            labelStyle={{ color: '#888' }}
          />
          <Bar dataKey={yKey} fill="#a78bfa" />
        </BarChart>
      )
    }
    if (chartType === 'pie') {
    const COLORS = ['#a78bfa', '#7c3aed', '#4c1d95', '#6d28d9', '#8b5cf6', '#c4b5fd', '#ddd6fe', '#ede9fe']
    return (
        <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
        </PieChart>
    )
    }
    return (
      <LineChart data={chartData}>
        <XAxis dataKey={xKey} tick={{ fill: '#888', fontSize: 10 }} />
        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
          labelStyle={{ color: '#888' }}
        />
        <Line type="monotone" dataKey={yKey} stroke="#a78bfa" dot={false} />
      </LineChart>
    )
  }

  return (
    <div className="chart-container">
      <h3>Transaction History</h3>
      <ResponsiveContainer width="100%" height={200}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default ChartContainer