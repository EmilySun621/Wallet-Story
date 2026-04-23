import { Link, useLocation } from 'react-router-dom'

function Navigation({ address, setAddress, onAnalyze, loading, addressError }) {
  const location = useLocation()

  return (
    <nav className="top-nav">
      <div className="nav-content">
        <div className="nav-left">
          <h1 className="nav-logo">
            <span className="logo-hex">⬡</span>
            WalletStory
          </h1>

          {/* WalletStory forensic investigation navigation */}
          <div className="nav-links">
            <Link
              to="/cases"
              className={`nav-link ${location.pathname === '/' || location.pathname === '/cases' ? 'active' : ''}`}
            >
              📚 Case Library
            </Link>
            <Link
              to="/investigation"
              className={`nav-link ${location.pathname === '/investigation' ? 'active' : ''}`}
            >
              🔍 Investigate
            </Link>
          </div>

          {/* Legacy wallet analysis navigation (commented out but kept) */}
          {/* <div className="nav-links">
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>
              Transactions
            </Link>
            <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
              Analytics
            </Link>
            <Link to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>
              Reports
            </Link>
            <Link to="/data-source" className={`nav-link ${location.pathname === '/data-source' ? 'active' : ''}`}>
              Data Source
            </Link>
          </div> */}
        </div>

        {/* Legacy wallet analysis input (hidden for forensic investigation UI) */}
        {/* <div className="nav-right">
          <div className="nav-search-group">
            <input
              className={`nav-wallet-input ${addressError ? 'error' : ''}`}
              placeholder="0x... Enter Ethereum Wallet Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              className="nav-analyze-btn"
              onClick={onAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Analyzing...
                </>
              ) : 'Analyze'}
            </button>
          </div>
        </div> */}
      </div>
      {addressError && <div className="nav-error">{addressError}</div>}
    </nav>
  )
}

export default Navigation
