import { useState } from 'react'
import { submitPulse, validateAccessCode } from '../services/airtable'

function AccessGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setChecking(true)
    setError(null)
    setPending(false)
    try {
      const participant = await validateAccessCode(trimmed)
      if (!participant) {
        setError("That access code wasn\u2019t recognized. Check your invite email and try again.")
        return
      }
      if (participant.status !== 'Active') {
        setPending(true)
        return
      }
      onUnlock(participant.networkName)
    } catch {
      setError('Something went wrong checking your code. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  if (pending) {
    return (
      <div className="access-gate-card">
        <div className="gate-icon">⏳</div>
        <h3>Application pending approval</h3>
        <p>
          Your access code was found but your participant status isn\u2019t active yet.
          You\u2019ll receive an email once your application has been reviewed.
        </p>
        <button className="btn btn-ghost" onClick={() => { setPending(false); setCode('') }}>
          Try a different code
        </button>
      </div>
    )
  }

  return (
    <div className="access-gate-card">
      <div className="gate-icon">🔑</div>
      <h3>Network participants only</h3>
      <p>
        The weekly pulse is for Civic Congruence network members. Enter your
        network access code to continue.
      </p>
      <form onSubmit={handleSubmit} className="gate-form">
        <div className="field-group">
          <label className="field-label" htmlFor="access-code">Access code</label>
          <input
            id="access-code"
            className="field-input gate-input"
            type="text"
            placeholder="e.g. CC-XXXXXX"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(null) }}
            autoComplete="off"
            spellCheck={false}
          />
          {error && <div className="error-msg">{error}</div>}
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={checking || !code.trim()}>
          {checking ? 'Checking\u2026' : 'Continue \u2192'}
        </button>
      </form>
      <p className="gate-footnote">
        Not a network member yet?{' '}
        <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Apply to join</span>
      </p>
    </div>
  )
}

function PulseForm({ networkName, onReset }) {
  const [form, setForm] = useState({ issue: '', affected: '', missing: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  function update(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function isComplete() {
    return form.issue.trim() && form.affected.trim() && form.missing.trim()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await submitPulse({
        'Issue This Week': form.issue.trim(),
        'Who Is Affected': form.affected.trim(),
        'What Is Missing': form.missing.trim(),
        'Network Name': networkName || '',
        'Submitted At': new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="submit-success">
        <div className="success-icon">✓</div>
        <h3>Pulse submitted</h3>
        <p>
          Thank you for your weekly check-in{networkName ? `, ${networkName}` : ''}.
          Your signal contributes to the real-time civic picture.
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => { setSubmitted(false); setForm({ issue: '', affected: '', missing: '' }) }}
        >
          Submit another pulse
        </button>
      </div>
    )
  }

  return (
    <form className="pulse-form" onSubmit={handleSubmit}>
      {networkName && (
        <div className="pulse-welcome">Welcome back, <strong>{networkName}</strong>.</div>
      )}

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-issue">What issue came up this week?</label>
        <div className="field-sublabel">Describe a specific situation, complaint, or need you encountered.</div>
        <textarea
          id="pulse-issue"
          className="field-textarea"
          placeholder="e.g. Three families on my block were served eviction notices after the new landlord acquired the building\u2026"
          value={form.issue}
          onChange={(e) => update('issue', e.target.value)}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-affected">Who is affected?</label>
        <div className="field-sublabel">Be as specific as you can — age group, neighborhood, demographic, etc.</div>
        <input
          id="pulse-affected"
          className="field-input"
          type="text"
          placeholder="e.g. Elderly renters in the Eastside district"
          value={form.affected}
          onChange={(e) => update('affected', e.target.value)}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-missing">What is missing or needed?</label>
        <div className="field-sublabel">What resource, policy, or response is absent? What would help?</div>
        <textarea
          id="pulse-missing"
          className="field-textarea"
          placeholder="e.g. A tenant protection ordinance, legal aid referral, or city housing office response\u2026"
          value={form.missing}
          onChange={(e) => update('missing', e.target.value)}
          required
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="pulse-submit">
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !isComplete()}>
          {submitting ? 'Submitting\u2026' : 'Submit pulse'}
        </button>
      </div>
    </form>
  )
}

export default function NetworkPulse() {
  const [networkName, setNetworkName] = useState(null)

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Network Pulse</div>
          <h2>Weekly Pulse Check-In</h2>
          <p>Weekly check-in for Civic Congruence network participants.</p>
        </div>

        {networkName === null
          ? <AccessGate onUnlock={setNetworkName} />
          : <PulseForm networkName={networkName} onReset={() => setNetworkName(null)} />
        }
      </div>
    </div>
  )
}
