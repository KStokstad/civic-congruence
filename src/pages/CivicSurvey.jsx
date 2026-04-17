import { useState } from 'react'
import { submitSurvey } from '../services/airtable'

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
        fieldName: 'Economy Q1',
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
        fieldName: 'Economy Q2',
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
        fieldName: 'Safety Q1',
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
        fieldName: 'Safety Q2',
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
        fieldName: 'Health Q1',
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
        fieldName: 'Health Q2',
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
        fieldName: 'Education Q1',
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
        fieldName: 'Education Q2',
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
        fieldName: 'Governance Q1',
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
        fieldName: 'Governance Q2',
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

export default function CivicSurvey({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const total = TOPICS.length
  const topic = TOPICS[step]

  function answer(fieldName, value) {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }))
  }

  function topicComplete() {
    return topic.questions.every((q) => answers[q.fieldName] !== undefined)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await submitSurvey({ ...answers, 'Submitted At': new Date().toISOString() })
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

  // ── Submitted confirmation ──────────────────────
  if (submitted) {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="submit-success">
            <div className="success-icon">✓</div>
            <h3>Thank you for your response</h3>
            <p>
              Your civic data has been recorded. Once verified it will contribute
              to the Civic Congruence dashboard.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('political-alignment')}>
                Understand your political values →
              </button>
              <button className="btn btn-ghost" onClick={reset}>Take it again</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Results screen ──────────────────────────────
  if (step === total) {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="results-screen">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Your Profile</div>
            <h2>Your Civic Alignment</h2>
            <p className="results-intro">Based on your answers across five civic domains.</p>

            <div className="results-grid">
              {TOPICS.map((t) => {
                const score = answers[t.questions[0].fieldName]
                const choice = answers[t.questions[1].fieldName]
                const pct = score ? (score / 5) * 100 : 0
                return (
                  <div className="result-row" key={t.id}>
                    <div className="result-row-top">
                      <div className="result-topic-name">
                        <span>{t.icon}</span>{t.label}
                      </div>
                      <span className="result-score-badge">{score} / 5</span>
                    </div>
                    <div className="result-bar-track">
                      <div className={`result-bar-fill ${getScoreColor(score)}`} style={{ width: `${pct}%` }} />
                    </div>
                    {choice && <div className="result-choice-text">Top concern: {choice}</div>}
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
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit my responses'}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Start over</button>
            </div>

            <div className="cross-link-nudge">
              <span>Curious about your political values?</span>
              <button className="btn btn-secondary" onClick={() => onNavigate('political-alignment')}>
                Understand your political values →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Question step ───────────────────────────────
  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Civic Survey</div>
          <h2>Community Alignment Survey</h2>
          <p>Share how you experience five key areas of civic life. Takes about 3 minutes.</p>
        </div>

        <div className="topic-step" key={topic.id}>
          <div className="survey-progress">
            <div className="progress-dots">
              {TOPICS.map((t, i) => (
                <div key={t.id} className={`progress-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              ))}
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
            </div>
          </div>

          <div className="topic-heading">
            <span style={{ fontSize: 28 }}>{topic.icon}</span>
            <div>
              <div className="topic-num">Topic {step + 1} of {total}</div>
              <h3>{topic.label}</h3>
            </div>
          </div>

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

          <div className="survey-nav">
            <div>
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
              )}
            </div>
            <div className="survey-nav-right">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{step + 1} / {total}</span>
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
      </div>
    </div>
  )
}
