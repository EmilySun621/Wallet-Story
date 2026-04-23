import { useNavigate, useLocation } from 'react-router-dom'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const mainSections = [
    { id: 'dashboard', label: 'Dashboard', path: '/' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' },
    { id: 'transactions', label: 'Transactions', path: '/transactions' },
    { id: 'reports', label: 'Reports', path: '/reports' },
    { id: 'insights', label: 'Insights', path: '/insights' },
    { id: 'data-source', label: 'Data Source', path: '/data-source' },
    { id: 'integrations', label: 'Integrations', path: '/integrations' },
    { id: 'documentation', label: 'Documentation', path: '/documentation' },
  ]

  const bottomSections = [
    { id: 'ai-settings', label: 'AI Settings', path: '/ai-settings' },
    { id: 'preferences', label: 'Preferences', path: '/preferences' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">WalletStory</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-main">
          {mainSections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${isActive(section.path) ? 'active' : ''}`}
              onClick={() => navigate(section.path)}
            >
              <span className="sidebar-label">{section.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          {bottomSections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${isActive(section.path) ? 'active' : ''}`}
              onClick={() => navigate(section.path)}
            >
              <span className="sidebar-label">{section.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
