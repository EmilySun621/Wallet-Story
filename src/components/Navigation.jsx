import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()

  return (
    <nav className="top-nav-full-width">
      <div className="nav-container-full">
        <div className="nav-left-full">
          <Link to="/" className="nav-logo-link">
            <h1 className="nav-logo-full">
              <span className="logo-hex">⬡</span>
              WalletStory
            </h1>
          </Link>
        </div>

        <div className="nav-links-full">
          <Link
            to="/"
            className={`nav-link-full ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
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
