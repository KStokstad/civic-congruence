import { useState } from 'react'
import Home from './pages/Home'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => setPage('home')}>
            Civic Congruence
          </button>
          <div className="nav-links">
            <button
              className={`nav-link ${page === 'home' ? 'active' : ''}`}
              onClick={() => setPage('home')}
            >
              Home
            </button>
            <button
              className={`nav-link ${page === 'survey' ? 'active' : ''}`}
              onClick={() => setPage('survey')}
            >
              Survey
            </button>
            <button
              className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'survey' && <Survey />}
        {page === 'dashboard' && <Dashboard />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">Civic Congruence</span>
          <span className="footer-copy">
            © {new Date().getFullYear()} · Civic Infrastructure Project
          </span>
        </div>
      </footer>
    </div>
  )
}
