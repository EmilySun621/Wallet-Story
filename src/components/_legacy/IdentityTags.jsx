function IdentityTags({ result }) {
  if (!result) return null

  const getRiskColor = (risk) => {
    const colors = {
      low: { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ade80', border: '#4ade80' },
      medium: { bg: 'rgba(251, 191, 36, 0.1)', text: '#fbbf24', border: '#fbbf24' },
      high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: '#ef4444' }
    }
    return colors[risk?.toLowerCase()] || colors.medium
  }

  const riskColors = getRiskColor(result.riskLevel)

  const tags = []

  // ENS name tag (if available)
  if (result.ensName) {
    tags.push({
      label: result.ensName,
      icon: '🏷️',
      style: { bg: 'rgba(124, 58, 237, 0.1)', text: '#a78bfa', border: '#7c3aed' }
    })
  }

  // Risk level tag
  if (result.riskLevel) {
    tags.push({
      label: `${result.riskLevel} Risk`,
      icon: result.riskLevel === 'high' ? '🔴' : result.riskLevel === 'medium' ? '🟡' : '🟢',
      style: riskColors
    })
  }

  // Behavior type tag
  if (result.type) {
    tags.push({
      label: result.type,
      icon: '👤',
      style: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: '#8b5cf6' }
    })
  }

  return (
    <div className="identity-tags-container">
      <div className="identity-tags-row">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="identity-tag"
            style={{
              background: tag.style.bg,
              color: tag.style.text,
              borderColor: tag.style.border
            }}
          >
            <span className="identity-tag-icon">{tag.icon}</span>
            <span className="identity-tag-label">{tag.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IdentityTags
