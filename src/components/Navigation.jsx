function Navigation({ address, setAddress, onAnalyze, loading, addressError }) {
  return (
    <nav className="top-nav">
      <div className="nav-content">
        <div className="nav-left">
          <h1 className="nav-logo">
            <span className="logo-hex">⬡</span>
            WalletStory
          </h1>
        </div>

        <div className="nav-right">
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
        </div>
      </div>
      {addressError && <div className="nav-error">{addressError}</div>}
    </nav>
  )
}

export default Navigation
