import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="top-nav">
      <div className="nav-content">
        <div className="nav-left">
          <h1 className="nav-logo">
            <span className="logo-hex">⬡</span>
            WalletStory
          </h1>

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
        </div>
      </div>
    </nav>
  )
}

export default Navigation
