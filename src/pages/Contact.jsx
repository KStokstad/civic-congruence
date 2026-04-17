import { useState } from 'react'
import { submitContact, submitApplication } from '../services/airtable'

const REASONS = [
  'Apply to join the pilot network',
  'Media or research inquiry',
  'General question',
  'Other',
]

export default function Contact({ onNavigate }) {
  const [fields, setFields] = useState({
    name: '',
    organization: '',
    email: '',
    reason: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  function update(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      await submitContact({
        'Name': fields.name,
        'Organization': fields.organization,
        'Email': fields.email,
        'Reason': fields.reason,
        'Message': fields.message,
        'Submitted At': now,
      })

      if (fields.reason === 'Apply to join the pilot network') {
        await submitApplication({
          'Contact Name': fields.name,
          'Email': fields.email,
          'Organization Name': fields.organization,
          'Notes': fields.message,
          'Status': 'Applied',
          'Application Date': now.slice(0, 10),
        }).catch(() => {})
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="contact-confirm">
            <h2>Message sent.</h2>
            <p>Thank you for reaching out. We'll follow up within a few days.</p>
            <button className="btn btn-ghost" onClick={() => onNavigate('home')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Contact</div>
          <h2>Contact.</h2>
          <p>
            Whether you want to join the pilot network, ask a question, or learn
            more about Civic Congruence.
          </p>
        </div>

        <form className="contact-form pulse-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              className="field-input"
              type="text"
              value={fields.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="contact-org">
              Organization <span className="field-optional">(optional)</span>
            </label>
            <input
              id="contact-org"
              className="field-input"
              type="text"
              value={fields.organization}
              onChange={(e) => update('organization', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              className="field-input"
              type="email"
              value={fields.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="contact-reason">
              Reason for reaching out
            </label>
            <select
              id="contact-reason"
              className="field-input field-select"
              value={fields.reason}
              onChange={(e) => update('reason', e.target.value)}
              required
            >
              <option value="" disabled>Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              className="field-textarea"
              style={{ minHeight: 120 }}
              value={fields.message}
              onChange={(e) => update('message', e.target.value)}
              required
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="pulse-submit">
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={submitting || !fields.name || !fields.email || !fields.reason || !fields.message}
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
