import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './ClusterForceGraph.css';

/**
 * ClusterForceGraph — Interactive force-directed graph of wallet cluster
 *
 * Props:
 *  - clusterData: object with {wallets: [...], funder: {...}, exchange: {...}, proxy: {...}}
 *  - onWalletClick: (wallet) => void - optional callback when wallet is clicked
 */
export default function ClusterForceGraph({ clusterData, onWalletClick }) {
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = containerRef.current?.querySelector('.graph-canvas');
      if (canvas) {
        const width = canvas.clientWidth - 4; // subtract border width
        const height = Math.max(500, canvas.clientHeight - 4);
        setDimensions({ width, height });
      }
    };

    // Initial size
    const timeoutId = setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!clusterData) {
    return (
      <div className="force-graph-container">
        <div className="graph-na-message">
          <div className="na-icon">🕸️</div>
          <p className="na-text">No cluster data available</p>
        </div>
      </div>
    );
  }

  const { wallets = [], funder = null, exchange = null, proxy = null } = clusterData;

  // Build graph data structure
  const nodes = [];
  const links = [];

  // Add wallet nodes
  wallets.forEach((wallet) => {
    nodes.push({
      id: wallet.address,
      type: 'wallet',
      label: `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
      trades: wallet.trades || 0,
      winRate: wallet.win_rate || 0,
      color: '#a78bfa'
    });
  });

  // Add infrastructure nodes and links
  if (funder) {
    const funderId = `funder-${funder.address || 'shared'}`;
    nodes.push({
      id: funderId,
      type: 'funder',
      label: '💰 Shared Funder',
      address: funder.address,
      color: '#fbbf24'
    });

    wallets.forEach((wallet) => {
      links.push({
        source: funderId,
        target: wallet.address,
        type: 'funding'
      });
    });
  }

  if (exchange) {
    const exchangeId = `exchange-${exchange.address || 'kraken'}`;
    nodes.push({
      id: exchangeId,
      type: 'exchange',
      label: '🏦 Kraken Exchange',
      address: exchange.address,
      color: '#10b981'
    });

    wallets.forEach((wallet) => {
      links.push({
        source: wallet.address,
        target: exchangeId,
        type: 'exchange'
      });
    });
  }

  if (proxy) {
    const proxyId = `proxy-${proxy.address || 'shared'}`;
    nodes.push({
      id: proxyId,
      type: 'proxy',
      label: '🌐 Shared Proxy',
      address: proxy.address,
      color: '#f59e0b'
    });

    wallets.forEach((wallet) => {
      links.push({
        source: proxyId,
        target: wallet.address,
        type: 'proxy'
      });
    });
  }

  const graphData = { nodes, links };

  const handleNodeClick = (node) => {
    if (node.type === 'wallet' && onWalletClick) {
      onWalletClick(node);
    }
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
  };

  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.label;
    const fontSize = 14 / globalScale;
    const nodeSize = node.type === 'wallet' ? 8 : 12;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Highlight hovered node
    if (hoveredNode && hoveredNode.id === node.id) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    // Only draw label for hovered node or infrastructure nodes to avoid overlap
    const shouldShowLabel = (hoveredNode && hoveredNode.id === node.id) || node.type !== 'wallet';

    if (shouldShowLabel) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e2e8f0';

      // Alternate label position based on node index to reduce overlap
      const labelOffset = nodeSize + fontSize + 2;
      ctx.fillText(label, node.x, node.y + labelOffset);
    }
  };

  const linkCanvasObject = (link, ctx) => {
    const start = link.source;
    const end = link.target;

    // Link color based on type
    const linkColor = link.type === 'funding' ? '#fbbf2440' :
                      link.type === 'exchange' ? '#10b98140' :
                      '#f59e0b40';

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  return (
    <div className="force-graph-container" ref={containerRef}>
      <div className="graph-header">
        <h3 className="graph-title">Cluster Network Visualization</h3>
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-dot wallet"></span>
            <span className="legend-label">Wallet ({wallets.length})</span>
          </div>
          {funder && (
            <div className="legend-item">
              <span className="legend-dot funder"></span>
              <span className="legend-label">Shared Funder</span>
            </div>
          )}
          {exchange && (
            <div className="legend-item">
              <span className="legend-dot exchange"></span>
              <span className="legend-label">Exchange</span>
            </div>
          )}
          {proxy && (
            <div className="legend-item">
              <span className="legend-dot proxy"></span>
              <span className="legend-label">Proxy</span>
            </div>
          )}
        </div>
      </div>

      <div className="graph-canvas">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0f172a"
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeHoverEnd={() => setHoveredNode(null)}
          cooldownTicks={100}
          nodeRelSize={10}
          linkWidth={2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          d3Force="charge"
          d3ForceCharge={-200}
        />
      </div>

      {hoveredNode && (
        <div className="node-tooltip">
          <div className="tooltip-header">{hoveredNode.type.toUpperCase()}</div>
          <div className="tooltip-content">
            {hoveredNode.type === 'wallet' && (
              <>
                <div className="tooltip-row">
                  <span>Address:</span>
                  <span className="mono">{hoveredNode.label}</span>
                </div>
                <div className="tooltip-row">
                  <span>Trades:</span>
                  <span>{hoveredNode.trades}</span>
                </div>
                <div className="tooltip-row">
                  <span>Win Rate:</span>
                  <span>{(hoveredNode.winRate * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
            {hoveredNode.type !== 'wallet' && (
              <div className="tooltip-row">
                <span>{hoveredNode.label}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="graph-footer">
        <p className="graph-hint">
          💡 <strong>Tip:</strong> Click wallet nodes to navigate. Hover for details. Drag to explore.
        </p>
      </div>
    </div>
  );
}
