import { useMemo } from 'react'

function ActivityHeatmap({ rawTxs }) {
  const heatmapData = useMemo(() => {
    if (!rawTxs || rawTxs.length === 0) return []

    // Get activity counts by date
    const activityByDate = {}
    rawTxs.forEach(tx => {
      if (tx.block_timestamp) {
        const date = tx.block_timestamp.slice(0, 10)
        activityByDate[date] = (activityByDate[date] || 0) + 1
      }
    })

    // Get date range (last 52 weeks = 364 days)
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 363)

    // Build grid data
    const gridData = []
    const currentDate = new Date(startDate)

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().slice(0, 10)
      const count = activityByDate[dateStr] || 0
      gridData.push({
        date: dateStr,
        count,
        day: currentDate.getDay(),
        weekIndex: Math.floor((currentDate - startDate) / (7 * 24 * 60 * 60 * 1000))
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return gridData
  }, [rawTxs])

  const getColor = (count) => {
    if (count === 0) return '#1a1a2e'
    if (count <= 2) return '#4c1d95'
    if (count <= 5) return '#6d28d9'
    if (count <= 10) return '#7c3aed'
    return '#a78bfa'
  }

  if (!rawTxs || rawTxs.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No transaction data available</p>
      </div>
    )
  }

  const weeks = Math.max(...heatmapData.map(d => d.weekIndex)) + 1
  const cellSize = 12
  const cellGap = 3

  return (
    <div className="heatmap-container">
      <div className="heatmap-labels">
        <div style={{ height: cellSize, marginBottom: cellGap }}>Mon</div>
        <div style={{ height: cellSize, marginBottom: cellGap }}></div>
        <div style={{ height: cellSize, marginBottom: cellGap }}>Wed</div>
        <div style={{ height: cellSize, marginBottom: cellGap }}></div>
        <div style={{ height: cellSize, marginBottom: cellGap }}>Fri</div>
        <div style={{ height: cellSize, marginBottom: cellGap }}></div>
        <div style={{ height: cellSize, marginBottom: cellGap }}>Sun</div>
      </div>

      <div className="heatmap-scroll">
        <svg
          width={weeks * (cellSize + cellGap)}
          height={7 * (cellSize + cellGap)}
          style={{ minWidth: '100%' }}
        >
          {heatmapData.map((cell, idx) => (
            <rect
              key={idx}
              x={cell.weekIndex * (cellSize + cellGap)}
              y={cell.day * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              fill={getColor(cell.count)}
              rx={2}
            >
              <title>{`${cell.date}: ${cell.count} transactions`}</title>
            </rect>
          ))}
        </svg>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 2, 5, 10, 15].map(count => (
          <div
            key={count}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: getColor(count),
              borderRadius: 2
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

export default ActivityHeatmap
