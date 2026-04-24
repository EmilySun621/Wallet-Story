import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
// WalletStory forensic investigation pages
import Home from './pages/Home'
import Investigation from './pages/Investigation'
import CaseLibrary from './pages/CaseLibrary_v2'
import Methodology from './pages/Methodology'

function App() {
  return (
    <Router>
      <div className="app-full-width">
        <Navigation />
        <main className="main-content-full-width">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cases" element={<CaseLibrary />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/methodology" element={<Methodology />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
