import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
import ScrollToTop from './components/ScrollToTop'
// WalletStory forensic investigation pages
import Home from './pages/Home'
import Investigation from './pages/Investigation'
import Methodology from './pages/Methodology'
import Beta from './pages/Beta'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-full-width">
        <Navigation />
        <main className="main-content-full-width">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/beta" element={<Beta />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
