import { useState, useEffect, useRef } from 'react'
import { renderMarkdown } from '../utils/renderMarkdown'

function parseTensionPoles(text) {
  const coreSection = text.match(/##\s+Core Orientation[^\n]*\n([\s\S]*?)(?=##|$)/i)
  if (!coreSection) return null
  const core = coreSection[1]
  const m = core.match(/tension between ([^.]+?) and ([^.!?]+)[.!?]/i)
  if (!m) return null
  const left = m[1].trim().replace(/^(the\s+|a\s+)/i, '')
  const right = m[2].trim().replace(/^(the\s+|a\s+)/i, '')
  return { left, right }
}

function parseAtAGlance(text) {
  function extractSection(name) {
    const re = new RegExp(`##\\s+${name}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, 'i')
    const m = text.match(re)
    return m ? m[1].trim() : ''
  }

  function firstSentence(block) {
    const clean = block.replace(/^[*-]\s+/, '').replace(/\*\*/g, '')
    const m = clean.match(/[^.!?]+[.!?]/)
    return m ? m[0].trim() : clean.split('\n')[0].trim()
  }

  function bullets(block) {
    return [...block.matchAll(/^[*-]\s+(.+)/gm)].map(m => m[1].replace(/\*\*/g, '').trim())
  }

  function shorten(str, maxWords = 12) {
    const words = str.split(/\s+/)
    return words.length <= maxWords ? str : words.slice(0, maxWords).join(' ') + '\u2026'
  }

  const core = extractSection('Core Orientation')
  const works = extractSection('Where This Works')
  const breaks = extractSection('Where It Breaks Down')

  const labelMatch = core.match(/one way to describe this orientation is ([^.,"]+)/i)
  const orientation = labelMatch
    ? labelMatch[1].trim().replace(/[."']$/, '')
    : shorten(firstSentence(core))

  const worksBullets = bullets(works)
  const breaksBullets = bullets(breaks)

  return {
    orientation,
    strength: shorten(worksBullets[0] || firstSentence(works)),
    tension:  shorten(breaksBullets[0] || firstSentence(breaks)),
    bestEnv:  shorten(worksBullets[2] || worksBullets[1] || firstSentence(works)),
  }
}

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

          {(() => {
            const { orientation, strength, tension, bestEnv } = parseAtAGlance(report)
            return (
              <div className="at-a-glance">
                <div className="at-a-glance-label">At a Glance</div>
                <ul className="at-a-glance-list">
                  <li><span className="at-a-glance-key">Orientation</span>{orientation}</li>
                  <li><span className="at-a-glance-key">Strength</span>{strength}</li>
                  <li><span className="at-a-glance-key">Tension</span>{tension}</li>
                  <li><span className="at-a-glance-key">Best environments</span>{bestEnv}</li>
                </ul>
              </div>
            )
          })()}

          <div className="report-content">
            {renderMarkdown(report)}
          </div>

          <div className="report-print-footer">
            civiccongruence.org &middot; Civic Infrastructure Project
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
