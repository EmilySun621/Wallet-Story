import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import './MoneyFlowSankey.css';

/**
 * MoneyFlowSankey — Money flow visualization using Sankey diagram
 *
 * Shows flow: Funder → Wallets → Exchange
 *
 * Props:
 *  - flowData: object with {funder: {...}, wallets: [...], exchange: {...}}
 */
export default function MoneyFlowSankey({ flowData }) {
  if (!flowData) {
    return (
      <div className="sankey-container">
        <div className="sankey-na-message">
          <div className="na-icon">💸</div>
          <p className="na-text">No money flow data available</p>
        </div>
      </div>
    );
  }

  const { funder, wallets = [], exchange } = flowData;

  // Build Sankey data structure
  const nodes = [];
  const links = [];

  // Add funder node
  if (funder) {
    nodes.push({
      name: '💰 Funder',
      nodeId: 0
    });
  }

  // Add wallet nodes
  wallets.forEach((wallet, idx) => {
    nodes.push({
      name: `Wallet ${idx + 1}`,
      nodeId: (funder ? 1 : 0) + idx
    });
  });

  // Add exchange node
  if (exchange) {
    nodes.push({
      name: '🏦 Kraken',
      nodeId: (funder ? 1 : 0) + wallets.length
    });
  }

  // Build links: Funder → Wallets
  if (funder) {
    wallets.forEach((wallet, idx) => {
      links.push({
        source: 0,
        target: 1 + idx,
        value: wallet.funding_amount || 1000 // Default value if not available
      });
    });
  }

  // Build links: Wallets → Exchange
  if (exchange) {
    wallets.forEach((wallet, idx) => {
      links.push({
        source: (funder ? 1 : 0) + idx,
        target: (funder ? 1 : 0) + wallets.length,
        value: wallet.exchange_volume || 800 // Default value if not available
      });
    });
  }

  const data = { nodes, links };

  return (
    <div className="sankey-container">
      <div className="sankey-header">
        <h3 className="sankey-title">Money Flow Diagram</h3>
        <p className="sankey-subtitle">
          Visualizing fund flow from shared funder through cluster wallets to exchange
        </p>
      </div>

      <div className="sankey-canvas">
        <ResponsiveContainer width="100%" height={500}>
          <Sankey
            data={data}
            node={{
              fill: '#a78bfa',
              stroke: '#7c3aed',
              strokeWidth: 2
            }}
            link={{
              stroke: '#94a3b8',
              strokeOpacity: 0.3
            }}
            nodePadding={50}
            margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
          >
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #a78bfa',
                borderRadius: '4px',
                color: '#e2e8f0'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Flow']}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      <div className="sankey-footer">
        <p className="sankey-note">
          <strong>Note:</strong> Link thickness represents transaction volume.
          Shared funder provides initial capital, which flows through cluster wallets
          to a common exchange (Kraken), indicating coordinated fund management.
        </p>
      </div>
    </div>
  );
}
