import { useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

function AddressNetworkGraph({ rawTxs, address }) {
  const graphData = useMemo(() => {
    if (!rawTxs || rawTxs.length === 0 || !address) {
      return { nodes: [], links: [] }
    }

    const normalizedAddress = address.toLowerCase()
    const interactions = {}

    // Count interactions with each address
    rawTxs.forEach(tx => {
      const otherAddress = tx.from_address?.toLowerCase() === normalizedAddress
        ? tx.to_address
        : tx.from_address

      if (otherAddress && otherAddress !== normalizedAddress) {
        interactions[otherAddress] = (interactions[otherAddress] || 0) + 1
      }
    })

    // Get top 10 most interacted addresses
    const topAddresses = Object.entries(interactions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Build nodes
    const nodes = [
      {
        id: normalizedAddress,
        label: 'Your Wallet',
        val: 20,
        color: '#a78bfa'
      },
      ...topAddresses.map(([addr, count]) => ({
        id: addr,
        label: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        val: Math.max(5, Math.min(count / 2, 15)),
        color: '#7c3aed'
      }))
    ]

    // Build links
    const links = topAddresses.map(([addr, count]) => ({
      source: normalizedAddress,
      target: addr,
      value: count,
      color: 'rgba(167, 139, 250, 0.3)'
    }))

    return { nodes, links }
  }, [rawTxs, address])

  if (graphData.nodes.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>No network data available</p>
      </div>
    )
  }

  return (
    <div style={{ height: '400px', background: '#0f0f1a', borderRadius: '8px' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="color"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Sans-Serif`

          // Draw node circle
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
          ctx.fillStyle = node.color
          ctx.fill()

          // Draw label
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#fff'
          ctx.fillText(label, node.x, node.y + node.val + fontSize)
        }}
        linkWidth={link => Math.sqrt(link.value)}
        linkColor={() => 'rgba(167, 139, 250, 0.3)'}
        backgroundColor="#0f0f1a"
        enableNodeDrag={true}
        enableZoomInteraction={true}
        cooldownTicks={100}
        onEngineStop={() => {}}
      />
    </div>
  )
}

export default AddressNetworkGraph
