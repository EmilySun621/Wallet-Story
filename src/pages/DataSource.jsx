function DataSource({ address }) {
  const dataSources = [
    {
      category: 'Identity & Labels',
      sources: [
        {
          name: 'Etherscan',
          description: 'View wallet transactions, balance, and labels',
          url: address ? `https://etherscan.io/address/${address}` : 'https://etherscan.io',
          icon: '🔍'
        },
        {
          name: 'ENS',
          description: 'Check Ethereum Name Service records',
          url: address ? `https://app.ens.domains/name/${address}` : 'https://app.ens.domains',
          icon: '🏷️'
        }
      ]
    },
    {
      category: 'News & Research',
      sources: [
        {
          name: 'Google News',
          description: 'Latest news about this wallet or its owner',
          url: address ? `https://www.google.com/search?q=${address}+ethereum&tbm=nws` : 'https://news.google.com',
          icon: '📰'
        },
        {
          name: 'CoinDesk',
          description: 'Cryptocurrency news and analysis',
          url: 'https://www.coindesk.com',
          icon: '📊'
        }
      ]
    },
    {
      category: 'DeFi Analytics',
      sources: [
        {
          name: 'DefiLlama',
          description: 'Track DeFi protocols and positions',
          url: address ? `https://defillama.com/portfolio/${address}` : 'https://defillama.com',
          icon: '📈'
        },
        {
          name: 'Zapper',
          description: 'DeFi portfolio tracker and analytics',
          url: address ? `https://zapper.xyz/account/${address}` : 'https://zapper.xyz',
          icon: '⚡'
        }
      ]
    },
    {
      category: 'Additional APIs',
      sources: [
        {
          name: 'Moralis API',
          description: 'Transaction data provider',
          url: 'https://moralis.io',
          icon: '🔗'
        },
        {
          name: 'Anthropic Claude',
          description: 'AI analysis and insights generation',
          url: 'https://www.anthropic.com',
          icon: '🤖'
        }
      ]
    }
  ]

  return (
    <div className="data-source-page">
      <div className="data-source-header">
        <h1>Data Sources</h1>
        <p>External services and APIs used to analyze wallet {address || 'addresses'}</p>
      </div>

      {dataSources.map((category, idx) => (
        <div key={idx} className="source-category">
          <h2 className="category-title">{category.category}</h2>
          <div className="sources-grid">
            {category.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-card"
              >
                <div className="source-icon">{source.icon}</div>
                <div className="source-content">
                  <h3 className="source-name">{source.name}</h3>
                  <p className="source-description">{source.description}</p>
                  <span className="source-link">
                    {source.url.length > 50 ? source.url.substring(0, 50) + '...' : source.url}
                  </span>
                </div>
                <div className="source-arrow">→</div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {address && (
        <div className="data-source-note">
          <p>
            <strong>Note:</strong> All links above are pre-filled with the current wallet address ({address}).
            Click any card to view detailed information on the external platform.
          </p>
        </div>
      )}
    </div>
  )
}

export default DataSource
