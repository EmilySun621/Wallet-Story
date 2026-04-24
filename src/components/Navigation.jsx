import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="top-nav-full-width">
      <div className="nav-container-full">
        <div className="nav-left-full">
          <h1 className="nav-logo-full">
            <span className="logo-hex">⬡</span>
            WalletStory
          </h1>
        </div>

        <div className="nav-links-full">
          <Link
            to="/cases"
            className={`nav-link-full ${location.pathname === '/' || location.pathname === '/cases' ? 'active' : ''}`}
          >
            Case Library
          </Link>
          <Link
            to="/methodology"
            className={`nav-link-full ${location.pathname === '/methodology' ? 'active' : ''}`}
          >
            Methodology
          </Link>
          <Link
            to="/investigation"
            className={`nav-link-full ${location.pathname === '/investigation' ? 'active' : ''}`}
          >
            Investigate
          </Link>
          <Link
            to="/beta"
            className={`nav-link-full ${location.pathname === '/beta' ? 'active' : ''}`}
          >
            Beta
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
