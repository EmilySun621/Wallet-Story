import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
// WalletStory forensic investigation pages
import Investigation from './pages/Investigation'
import CaseLibrary from './pages/CaseLibrary_v2'

function App() {

  return (
    <Router>
      <div className="app-container">
        <Navigation />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<CaseLibrary />} />
            <Route path="/cases" element={<CaseLibrary />} />
            <Route path="/investigation" element={<Investigation />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
