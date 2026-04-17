import { useState, useEffect, useRef } from 'react'

const POLL_INTERVAL = 3000
const MAX_POLLS = 100 // 5 minutes

export default function Report({ onNavigate }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const pollCount = useRef(0)
  const timer = useRef(null)

  const sessionId = new URLSearchParams(window.location.search).get('session_id')

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

  function renderReport(text) {
    const sectionPattern = /^([A-Z][A-Z &]+)$/m
    const parts = text.split(/\n(?=[A-Z][A-Z &]+\n)/)
    return parts.map((part, i) => {
      const lines = part.trim().split('\n')
      const heading = lines[0]
      const body = lines.slice(1).join('\n').trim()
      const isHeading = sectionPattern.test(heading)
      return (
        <div key={i} className="report-section">
          {isHeading
            ? <h2 className="report-section-heading">{heading}</h2>
            : <p className="report-body">{heading}</p>
          }
          {body && <div className="report-body">{body.split('\n').map((line, j) => (
            <p key={j}>{line}</p>
          ))}</div>}
        </div>
      )
    })
  }

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
          <div className="section-label" style={{ marginBottom: 8 }}>Political Alignment</div>
          <h1 style={{ marginBottom: 8 }}>Your Deep Dive Report</h1>
          <p className="report-email-note">
            A copy has been sent to your email.
          </p>
          <div className="report-content">
            {renderReport(report)}
          </div>
          <div style={{ marginTop: 40 }}>
            <button className="btn btn-ghost" onClick={() => onNavigate('home')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
