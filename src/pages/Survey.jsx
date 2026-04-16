import { useState } from 'react'
import { submitSurvey, submitPulse, validateAccessCode } from '../services/airtable'

const TOPICS = [
  {
    id: 'economy',
    label: 'Economy',
    icon: '📊',
    questions: [
      {
        id: 'q1',
        text: 'How much should government prioritize reducing economic inequality vs. growing the overall economy?',
        type: 'scale',
        lowLabel: 'Focus on growth',
        highLabel: 'Reduce inequality',
        fieldName: 'Economy - Inequality vs Growth',
      },
      {
        id: 'q2',
        text: 'What best describes your view on the minimum wage?',
        type: 'choice',
        options: [
          'It should be higher than it is now',
          'It is roughly appropriate',
          'It should not be set by the government',
          'It should vary by region, not be national',
        ],
        fieldName: 'Economy - Minimum Wage View',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: '🛡️',
    questions: [
      {
        id: 'q1',
        text: 'When it comes to public safety, where do you put more emphasis?',
        type: 'scale',
        lowLabel: 'Enforcement and deterrence',
        highLabel: 'Prevention and root causes',
        fieldName: 'Safety - Emphasis',
      },
      {
        id: 'q2',
        text: 'What would most improve public safety where you live?',
        type: 'choice',
        options: [
          'More community policing',
          'Mental health resources',
          'Better lighting & infrastructure',
          'Youth programs',
          'Neighborhood watch',
        ],
        fieldName: 'Safety - Top Improvement',
      },
    ],
  },
  {
    id: 'health',
    label: 'Health',
    icon: '🏥',
    questions: [
      {
        id: 'q1',
        text: 'How would you rate access to quality healthcare in your area?',
        type: 'scale',
        lowLabel: 'Very poor',
        highLabel: 'Excellent',
        fieldName: 'Health - Access Rating',
      },
      {
        id: 'q2',
        text: 'What is the biggest health challenge facing your community?',
        type: 'choice',
        options: [
          'Cost of care',
          'Access to specialists',
          'Mental health services',
          'Environmental health',
          'Preventive care',
        ],
        fieldName: 'Health - Top Challenge',
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    icon: '🎓',
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you with the quality of public education in your area?',
        type: 'scale',
        lowLabel: 'Very dissatisfied',
        highLabel: 'Very satisfied',
        fieldName: 'Education - Satisfaction',
      },
      {
        id: 'q2',
        text: 'What should be the top priority for local schools?',
        type: 'choice',
        options: [
          'Teacher pay & retention',
          'School facilities',
          'Early childhood programs',
          'Vocational & trade training',
          'Technology access',
        ],
        fieldName: 'Education - Top Priority',
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: '🏛️',
    questions: [
      {
        id: 'q1',
        text: 'How much do you trust that elections in your community accurately reflect the will of voters?',
        type: 'scale',
        lowLabel: 'Very little',
        highLabel: 'A great deal',
        fieldName: 'Governance - Election Trust',
      },
      {
        id: 'q2',
        text: 'What would most improve civic trust in your community?',
        type: 'choice',
        options: [
          'Greater transparency',
          'More public input on decisions',
          'Faster response to issues',
          'Independent oversight',
          'Better communication',
        ],
        fieldName: 'Governance - Top Improvement',
      },
    ],
  },
]

function getScoreColor(score) {
  if (score <= 2) return 'score-low'
  if (score <= 3) return 'score-mid'
  return 'score-high'
}

function buildSummary(answers) {
  const scored = TOPICS.map((t) => ({
    label: t.label,
    score: answers[t.questions[0].fieldName] || 0,
  })).sort((a, b) => a.score - b.score)

  const topConcerns = scored.filter((t) => t.score <= 2).map((t) => t.label)
  const strengths = scored.filter((t) => t.score >= 4).map((t) => t.label)

  if (topConcerns.length > 0) {
    return `Your top concern${topConcerns.length > 1 ? 's are' : ' is'} ${topConcerns.join(' and ')}. ${strengths.length > 0 ? `You feel relatively positive about ${strengths.join(' and ')}.` : 'Your responses show significant gaps across multiple civic areas.'}`
  }
  if (strengths.length > 0) {
    return `You feel positive about ${strengths.join(' and ')}. Areas with moderate scores represent room for local improvement.`
  }
  return 'Your responses reflect mixed satisfaction across civic areas — a common pattern in communities navigating complex, interconnected challenges.'
}

/* ─── Public Alignment Survey ─────────────────── */
function AlignmentSurvey() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const topic = TOPICS[step]
  const total = TOPICS.length

  function answer(fieldName, value) {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }))
  }

  function topicComplete() {
    return topic.questions.every((q) => answers[q.fieldName] !== undefined)
  }

  async function handleFinish() {
    setSubmitting(true)
    setError(null)
    try {
      await submitSurvey({
        ...answers,
        'Submitted At': new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setSubmitted(false)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="submit-success">
        <div className="success-icon">✓</div>
        <h3>Thank you for your response</h3>
        <p>
          Your civic alignment data has been recorded. Once verified, it will contribute
          to the Civic Congruence dashboard.
        </p>
        <button className="btn btn-ghost" onClick={reset}>
          Take the survey again
        </button>
      </div>
    )
  }

  if (step === total) {
    return (
      <div className="results-screen">
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Your Profile</div>
        <h2>Your Civic Alignment</h2>
        <p className="results-intro">
          Based on your answers across five civic domains.
        </p>

        <div className="results-grid">
          {TOPICS.map((t) => {
            const score = answers[t.questions[0].fieldName]
            const choice = answers[t.questions[1].fieldName]
            const pct = score ? (score / 5) * 100 : 0
            return (
              <div className="result-row" key={t.id}>
                <div className="result-row-top">
                  <div className="result-topic-name">
                    <span>{t.icon}</span>
                    {t.label}
                  </div>
                  <span className="result-score-badge">{score} / 5</span>
                </div>
                <div className="result-bar-track">
                  <div
                    className={`result-bar-fill ${getScoreColor(score)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {choice && (
                  <div className="result-choice-text">Top concern: {choice}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="results-summary">
          <h4>Your alignment snapshot</h4>
          <p>{buildSummary(answers)}</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="results-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleFinish}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit my responses'}
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="topic-step" key={topic.id}>
      {/* Progress */}
      <div className="survey-progress">
        <div className="progress-dots">
          {TOPICS.map((t, i) => (
            <div
              key={t.id}
              className={`progress-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((step) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Topic heading */}
      <div className="topic-heading">
        <span style={{ fontSize: 28 }}>{topic.icon}</span>
        <div>
          <div className="topic-num">Topic {step + 1} of {total}</div>
          <h3>{topic.label}</h3>
        </div>
      </div>

      {/* Questions */}
      {topic.questions.map((q) => (
        <div className="question-block" key={q.id}>
          <div className="question-text">{q.text}</div>

          {q.type === 'scale' && (
            <div className="scale-wrapper">
              <div className="scale-options">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`scale-btn ${answers[q.fieldName] === n ? 'selected' : ''}`}
                    onClick={() => answer(q.fieldName, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="scale-labels">
                <span className="scale-label-text">{q.lowLabel}</span>
                <span className="scale-label-text">{q.highLabel}</span>
              </div>
            </div>
          )}

          {q.type === 'choice' && (
            <div className="choice-options">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  className={`choice-btn ${answers[q.fieldName] === opt ? 'selected' : ''}`}
                  onClick={() => answer(q.fieldName, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Navigation */}
      <div className="survey-nav">
        <div>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
        </div>
        <div className="survey-nav-right">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {step + 1} / {total}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setStep((s) => s + 1)}
            disabled={!topicComplete()}
          >
            {step === total - 1 ? 'See my results →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Access Code Gate ────────────────────────── */
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
    } catch (err) {
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
          Your access code was found but your participant status isn't active yet.
          You'll receive an email once your application has been reviewed.
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
          <label className="field-label" htmlFor="access-code">
            Access code
          </label>
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
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={checking || !code.trim()}
        >
          {checking ? 'Checking…' : 'Continue →'}
        </button>
      </form>
      <p className="gate-footnote">
        Not a network member yet?{' '}
        <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Apply to join</span>
      </p>
    </div>
  )
}

/* ─── Network Pulse Form ──────────────────────── */
function PulseForm() {
  const [networkName, setNetworkName] = useState(null) // null = locked
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
        'Issue': form.issue.trim(),
        'Who is Affected': form.affected.trim(),
        'What is Missing': form.missing.trim(),
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

  if (networkName === null) {
    return <AccessGate onUnlock={(name) => setNetworkName(name)} />
  }

  if (submitted) {
    return (
      <div className="submit-success">
        <div className="success-icon">✓</div>
        <h3>Pulse submitted</h3>
        <p>
          Thank you for your weekly check-in{networkName ? `, ${networkName}` : ''}. Your
          signal contributes to the real-time civic picture.
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
        <div className="pulse-welcome">
          Welcome back, <strong>{networkName}</strong>.
        </div>
      )}

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-issue">
          What issue came up this week?
        </label>
        <div className="field-sublabel">
          Describe a specific situation, complaint, or need you encountered.
        </div>
        <textarea
          id="pulse-issue"
          className="field-textarea"
          placeholder="e.g. Three families on my block were served eviction notices after the new landlord acquired the building…"
          value={form.issue}
          onChange={(e) => update('issue', e.target.value)}
          required
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="pulse-affected">
          Who is affected?
        </label>
        <div className="field-sublabel">
          Be as specific as you can — age group, neighborhood, demographic, etc.
        </div>
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
        <label className="field-label" htmlFor="pulse-missing">
          What is missing or needed?
        </label>
        <div className="field-sublabel">
          What resource, policy, or response is absent? What would help?
        </div>
        <textarea
          id="pulse-missing"
          className="field-textarea"
          placeholder="e.g. A tenant protection ordinance, legal aid referral, or city housing office response…"
          value={form.missing}
          onChange={(e) => update('missing', e.target.value)}
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
          {submitting ? 'Submitting…' : 'Submit pulse'}
        </button>
      </div>
    </form>
  )
}

/* ─── Survey Page ─────────────────────────────── */
export default function Survey() {
  const [activeTab, setActiveTab] = useState('survey')

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Civic Input</div>
          <h2>
            {activeTab === 'survey' ? 'Public Alignment Survey' : 'Network Pulse'}
          </h2>
          <p>
            {activeTab === 'survey'
              ? 'Share how you experience five key areas of civic life. Takes about 3 minutes.'
              : 'Weekly check-in for Civic Congruence network participants.'}
          </p>
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'survey' ? 'active' : ''}`}
            onClick={() => setActiveTab('survey')}
          >
            Public Survey
          </button>
          <button
            className={`tab-btn ${activeTab === 'pulse' ? 'active' : ''}`}
            onClick={() => setActiveTab('pulse')}
          >
            Network Pulse
          </button>
        </div>

        {activeTab === 'survey' ? <AlignmentSurvey /> : <PulseForm />}
      </div>
    </div>
  )
}
