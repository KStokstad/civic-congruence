import { useState } from 'react'
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

function getInitialPage() {
  const path = window.location.pathname
  if (path === '/report' || path.startsWith('/report/')) return 'report'
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => setPage('home')}>
            Civic Congruence
          </button>
          <div className="nav-links">
            {NAV.map(({ id, label }) => (
              <button
                key={id}
                className={`nav-link ${page === id ? 'active' : ''}`}
                onClick={() => setPage(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {page === 'home'                && <Home onNavigate={setPage} />}
        {page === 'about'               && <About onNavigate={setPage} />}
        {page === 'contact'             && <Contact onNavigate={setPage} />}
        {page === 'civic-survey'        && <CivicSurvey onNavigate={setPage} />}
        {page === 'political-alignment' && <PoliticalAlignment onNavigate={setPage} />}
        {page === 'network-pulse'       && <NetworkPulse />}
        {page === 'dashboard'           && <Dashboard />}
        {page === 'report'              && <Report onNavigate={setPage} />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-logo">Civic Congruence</span>
            <span className="footer-copy">
              © {new Date().getFullYear()} · Civic Infrastructure Project
            </span>
          </div>
          <button className="footer-link" onClick={() => setPage('contact')}>
            Contact
          </button>
        </div>
      </footer>
    </div>
  )
}
