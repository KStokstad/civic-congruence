import { useState, useEffect, useCallback } from 'react'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import CivicSurvey from './pages/CivicSurvey'
import PoliticalAlignment from './pages/PoliticalAlignment'
import NetworkPulse from './pages/NetworkPulse'
import Dashboard from './pages/Dashboard'
import Report from './pages/Report'
import './App.css'

const NAV = [
  { id: 'home',                label: 'Home' },
  { id: 'about',               label: 'About' },
  { id: 'civic-survey',        label: 'Civic Survey' },
  { id: 'political-alignment', label: 'Political Alignment' },
  { id: 'network-pulse',       label: 'Network Pulse' },
  { id: 'dashboard',           label: 'Dashboard' },
]

const VALID_PAGES = new Set([
  'home', 'about', 'contact', 'civic-survey',
  'political-alignment', 'network-pulse', 'dashboard', 'report',
])

function pageFromHash(hash) {
  const id = hash.replace(/^#\//, '')
  return VALID_PAGES.has(id) ? id : 'home'
}

function getInitialPage() {
  const path = window.location.pathname
  if (path === '/report' || path.startsWith('/report/')) return 'report'
  if (window.location.hash) return pageFromHash(window.location.hash)
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)

  const navigate = useCallback((id) => {
    setPage(id)
    window.location.hash = id === 'home' ? '' : `/${id}`
  }, [])

  useEffect(() => {
    const onPopState = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => navigate('home')}>
            Civic Congruence
          </button>
          <div className="nav-links">
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                className={`nav-link ${page === id ? 'active' : ''}`}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {page === 'home'                && <Home onNavigate={navigate} />}
        {page === 'about'               && <About onNavigate={navigate} />}
        {page === 'contact'             && <Contact onNavigate={navigate} />}
        {page === 'civic-survey'        && <CivicSurvey onNavigate={navigate} />}
        {page === 'political-alignment' && <PoliticalAlignment onNavigate={navigate} />}
        {page === 'network-pulse'       && <NetworkPulse />}
        {page === 'dashboard'           && <Dashboard onNavigate={navigate} />}
        {page === 'report'              && <Report onNavigate={navigate} />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-logo">Civic Congruence</span>
            <span className="footer-copy">
              © {new Date().getFullYear()} · Civic Congruence · Pilot project
            </span>
          </div>
          <button className="footer-link" onClick={() => navigate('contact')}>
            Contact
          </button>
        </div>
      </footer>
    </div>
  )
}
