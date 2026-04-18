import { useState, useEffect, useRef } from 'react'
import { renderMarkdown } from '../utils/renderMarkdown'

const POLL_INTERVAL = 3000
const MAX_POLLS = 100 // 5 minutes

export default function Report({ onNavigate }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const pollCount = useRef(0)
  const timer = useRef(null)

  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('session_id')
  const emailFromCheckout = params.get('email') ?? ''

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found in the URL.')
      setStatus('error')
      return
    }

    async function poll() {
      pollCount.current += 1

      if (pollCount.current > MAX_POLLS) {
        setError('Report is taking longer than expected. Check your email — it will be sent when ready.')
        setStatus('error')
        return
      }

      try {
        const res = await fetch(`/api/get-report?session_id=${encodeURIComponent(sessionId)}`)
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()

        if (data.generated && data.report) {
          setReport(data.report)
          setStatus('ready')
          return
        }
      } catch (err) {
        console.error('Poll error:', err)
      }

      timer.current = setTimeout(poll, POLL_INTERVAL)
    }

    poll()

    return () => clearTimeout(timer.current)
  }, [sessionId])

  if (status === 'error') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="contact-confirm">
            <h2>Something went wrong.</h2>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={() => onNavigate('political-alignment')}>
              Back to diagnostic
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="generating-state">
            <div className="generating-spinner" />
            <h3>Generating your report&hellip;</h3>
            <p>This takes about 30 seconds. Don't close this tab.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="report-page">

          <button
            className="report-back-link"
            onClick={() => onNavigate('home')}
          >
            &larr; Home
          </button>

          <div className="section-label" style={{ marginBottom: 8 }}>Political Alignment</div>
          <h1 style={{ marginBottom: 8 }}>Your Deep Dive Report</h1>
          <p className="report-email-note">
            A copy has been sent to your email.
          </p>

          <div className="report-content">
            {renderMarkdown(report)}
          </div>

          <div className="report-actions">
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('civic-survey')}>
              Take the Civic Survey
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
