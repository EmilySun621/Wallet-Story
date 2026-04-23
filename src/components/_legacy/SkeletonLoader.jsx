function SkeletonLoader({ type = 'card' }) {
  if (type === 'chart') {
    return (
      <div className="skeleton-chart">
        <div className="skeleton-title"></div>
        <div className="skeleton-chart-body"></div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-title"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-row"></div>
        ))}
      </div>
    )
  }

  if (type === 'insight') {
    return (
      <div className="skeleton-insight">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-insight-card">
            <div className="skeleton-circle"></div>
            <div className="skeleton-text-block">
              <div className="skeleton-text short"></div>
              <div className="skeleton-text long"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="skeleton-card">
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
    </div>
  )
}

export default SkeletonLoader
