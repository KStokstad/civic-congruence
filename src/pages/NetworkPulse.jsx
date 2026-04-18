import { useState } from 'react'
import { submitPulse, validateAccessCode, submitApplication, submitSubscriber } from '../services/airtable'

function ApplicationForm({ onBack }) {
  const [form, setForm] = useState({
    org: '', name: '', email: '', location: '', description: '', why: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  function update(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function isComplete() {
    return form.org.trim() && form.name.trim() && form.email.trim() &&
      form.location.trim() && form.description.trim() && form.why.trim()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (honeypot) return
    setSubmitting(true)
    setError(null)
    try {
      await submitApplication({
        'Name': form.name.trim(),
        'Organization Name': form.org.trim(),
        'Email': form.email.trim(),
        'Location': form.location.trim(),
        'Organization Description': form.description.trim(),
        'Why Participate': form.why.trim(),
        'Status': 'Applied',
        'Application Date': new Date().toISOString().slice(0, 10),
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
        <h3>Application received</h3>
        <p>
          Thank you for applying. We review applications within a few days and will
          follow up by email.
        </p>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    )
  }

  return (
    <div className="application-form-wrap">
      <div className="application-form-header">
        <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={onBack}>
          ← Back
        </button>
        <div className="section-label">Network Application</div>
        <h3>Join the network</h3>
        <p>
          Tell us about your organization and why you want to participate. We'll follow up by email within a few days.
        </p>
      </div>

      <form className="pulse-form" onSubmit={handleSubmit}>
        <input
          name="website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex="-1"
          autoComplete="off"
          aria-hidden="true"
          style={{ display: 'none', position: 'absolute', left: '-9999px' }}
        />
        <div className="field-group">
          <label className="field-label" htmlFor="app-org">Organization name</label>
          <input
            id="app-org"
            className="field-input"
            type="text"
            value={form.org}
            onChange={(e) => update('org', e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="app-name">Your name</label>
          <input
            id="app-name"
            className="field-input"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="app-email">Email</label>
          <input
            id="app-email"
            className="field-input"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="app-location">Location</label>
          <div className="field-sublabel">City and state</div>
          <input
            id="app-location"
            className="field-input"
            type="text"
            placeholder="e.g. Chicago, IL"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="app-description">About your organization</label>
          <div className="field-sublabel">Brief description of your organization and the community you serve.</div>
          <textarea
            id="app-description"
            className="field-textarea"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="app-why">Why you want to participate</label>
          <div className="field-sublabel">Why do you want to join the Civic Congruence pilot?</div>
          <textarea
            id="app-why"
            className="field-textarea"
            value={form.why}
            onChange={(e) => update('why', e.target.value)}
            required
          />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="pulse-submit">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || !isComplete()}
          >
            {submitting ? 'Submitting\u2026' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AccessGate({ onUnlock, onApply }) {
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
        Weekly signal from organizations working directly with communities. This
        is where early patterns show up before they become visible publicly.
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
        <button
          className="gate-apply-link"
          type="button"
          onClick={onApply}
        >
          Join the network
        </button>
      </p>
    </div>
  )
}

function PulseForm({ networkName, onReset }) {
  const [form, setForm] = useState({ issue: '', affected: '', missing: '', highlight: '' })
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
      const fields = {
        'Issue This Week': form.issue.trim(),
        'Who Is Affected': form.affected.trim(),
        'What Is Missing': form.missing.trim(),
        'Network Name': networkName || '',
        'Submitted At': new Date().toISOString(),
      }
      if (form.highlight.trim()) fields['Community Highlight'] = form.highlight.trim()
      await submitPulse(fields)
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
          onClick={() => { setSubmitted(false); setForm({ issue: '', affected: '', missing: '', highlight: '' }) }}
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

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-highlight">
          Community highlight <span className="field-optional">(optional)</span>
        </label>
        <div className="field-sublabel">Is there something from your organization this week you'd like shared in the signal brief? A program, event, outcome, or moment worth noting.</div>
        <textarea
          id="pulse-highlight"
          className="field-textarea"
          style={{ minHeight: 80 }}
          value={form.highlight}
          onChange={(e) => update('highlight', e.target.value)}
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
  const [view, setView] = useState('gate') // 'gate' | 'apply' | 'pulse'
  const [networkName, setNetworkName] = useState(null)
  const [subEmail, setSubEmail] = useState('')
  const [subStatus, setSubStatus] = useState('idle')

  function handleUnlock(name) {
    setNetworkName(name)
    setView('pulse')
  }

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!subEmail) return
    setSubStatus('submitting')
    try {
      await submitSubscriber({ 'Email': subEmail, 'Subscribed At': new Date().toISOString() })
      setSubStatus('done')
    } catch {
      setSubStatus('idle')
    }
  }

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Network Pulse</div>
          <h2>Weekly Pulse Check-In</h2>
          <p>Weekly check-in for Civic Congruence network participants.</p>
        </div>

        {view === 'gate' && (
          <AccessGate onUnlock={handleUnlock} onApply={() => setView('apply')} />
        )}
        {view === 'apply' && (
          <ApplicationForm onBack={() => setView('gate')} />
        )}
        {view === 'pulse' && (
          <PulseForm networkName={networkName} onReset={() => setView('gate')} />
        )}

        {view === 'gate' && (
          <div className="inline-subscribe">
            <h4 className="inline-subscribe-heading">Weekly Signal Brief</h4>
            <p className="inline-subscribe-sub">Weekly summary of civic signals across the network. No opinion. Just pattern.</p>
            {subStatus === 'done' ? (
              <p className="inline-subscribe-confirm">You're on the list.</p>
            ) : (
              <form className="inline-subscribe-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="field-input"
                  placeholder="you@email.com"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary" disabled={subStatus === 'submitting'}>
                  {subStatus === 'submitting' ? 'Subscribing\u2026' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
