import { useState } from 'react'
import { submitSurvey } from '../services/airtable'

const EXPERIENCE_OPTIONS = [
  'Yes, it affected me directly',
  'Yes, someone in my household',
  'No direct impact',
  'Prefer not to say',
]

const TOPICS = [
  {
    id: 'economy',
    label: 'Economy',
    icon: '📊',
    scale: {
      text: 'When real tradeoffs have to be made in your community right now, where do you lean?',
      lowLabel: 'Economic growth',
      highLabel: 'Lower household costs',
      fieldName: 'Economy Scale',
      labels: [
        'Strongly favor growth',
        'Slightly favor growth',
        'Balance both',
        'Slightly favor reducing costs',
        'Strongly favor reducing costs',
      ],
    },
    followUp: {
      text: 'In the past year, has an economic issue — job loss, wage pressure, housing cost, debt — directly affected you or someone in your household?',
      options: EXPERIENCE_OPTIONS,
      fieldName: 'Economy Experience',
    },
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: '🛡️',
    scale: {
      text: 'When real tradeoffs have to be made in your community right now, where do you lean?',
      lowLabel: 'Enforcement',
      highLabel: 'Prevention',
      fieldName: 'Safety Scale',
      labels: [
        'Strongly favor enforcement',
        'Slightly favor enforcement',
        'Balance both',
        'Slightly favor prevention',
        'Strongly favor prevention',
      ],
    },
    followUp: {
      text: 'In the past year, has a safety issue — crime, violence, unsafe conditions, lack of emergency response — directly affected you or someone in your household?',
      options: EXPERIENCE_OPTIONS,
      fieldName: 'Safety Experience',
    },
  },
  {
    id: 'health',
    label: 'Health',
    icon: '🏥',
    scale: {
      text: 'When real tradeoffs have to be made in your community right now, where do you lean?',
      lowLabel: 'Expand access',
      highLabel: 'Maintain quality',
      fieldName: 'Health Scale',
      labels: [
        'Strongly favor expanding access',
        'Slightly favor expanding access',
        'Balance both',
        'Slightly favor maintaining quality of care',
        'Strongly favor maintaining quality of care',
      ],
    },
    followUp: {
      text: 'In the past year, has a health issue — cost of care, access to providers, mental health, chronic illness — directly affected you or someone in your household?',
      options: EXPERIENCE_OPTIONS,
      fieldName: 'Health Experience',
    },
  },
  {
    id: 'education',
    label: 'Education',
    icon: '🎓',
    scale: {
      text: 'When real tradeoffs have to be made in your community right now, where do you lean?',
      lowLabel: 'Common standards',
      highLabel: 'Local flexibility',
      fieldName: 'Education Scale',
      labels: [
        'Strongly favor common standards',
        'Slightly favor common standards',
        'Balance both',
        'Slightly favor local flexibility',
        'Strongly favor local flexibility',
      ],
    },
    followUp: {
      text: 'In the past year, has an education issue — school quality, access, cost, or outcomes — directly affected you or someone in your household?',
      options: EXPERIENCE_OPTIONS,
      fieldName: 'Education Experience',
    },
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: '🏛️',
    scale: {
      text: 'How confident are you that local decisions actually reflect the needs of people in your community?',
      lowLabel: 'Not confident',
      highLabel: 'Very confident',
      fieldName: 'Governance Scale',
      labels: [
        'Not at all confident',
        'Slightly confident',
        'Somewhat confident',
        'Mostly confident',
        'Very confident',
      ],
    },
    followUp: {
      text: 'In the past year, have you participated in a local civic process — attending a meeting, contacting a representative, voting in a local election, or signing a petition?',
      options: [
        'Yes, I participated',
        'No, I did not',
        'I wanted to but didn\u2019t know how',
        'I didn\u2019t think it would make a difference',
      ],
      fieldName: 'Governance Action',
    },
  },
]

const CLOSING_FIELD = 'Biggest Impact'
const CLOSING_OPTIONS = ['Economy', 'Safety', 'Health', 'Education', 'Governance']

function getScoreColor(score) {
  if (score <= 2) return 'score-low'
  if (score <= 3) return 'score-mid'
  return 'score-high'
}

function getScores(answers) {
  return TOPICS.map((t) => ({
    label: t.label,
    score: answers[t.scale.fieldName] || 0,
  }))
}

function stdDev(scores) {
  const vals = scores.map((s) => s.score)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
  return Math.sqrt(variance)
}

function buildSnapshot(answers) {
  const scores = getScores(answers)
  const vals = scores.map((s) => s.score)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]

  if (vals.every((v) => v < 2.5)) {
    return 'Your responses reflect low confidence across all areas — a pattern that suggests systemic concerns rather than isolated problems.'
  }
  if (vals.every((v) => v > 3.5)) {
    return 'Your responses reflect broadly positive views across civic systems — a relatively uncommon pattern worth noting.'
  }
  if (vals.every((v) => v >= 2.5 && v <= 3.5)) {
    return 'Your responses suggest moderate satisfaction across most areas, with no single system standing out as strongly effective — a pattern that often points to systems that are functioning, but not fully responsive.'
  }
  if (avg - lowest.score > 1) {
    return `Your responses show relatively consistent views across most areas, with ${lowest.label} standing out as a clear concern.`
  }
  if (highest.score - avg > 1) {
    return `Your strongest area is ${highest.label}, though other areas score more modestly — suggesting uneven performance across civic systems.`
  }
  return 'Your responses reflect a mixed picture across civic systems — some areas performing more consistently than others.'
}

function buildComparativeInsight(answers) {
  const scores = getScores(answers)
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]
  const spread = highest.score - lowest.score

  if (scores.every((s) => s.score <= 3)) {
    return 'No area scored above 3 — your community may not have a clear area of strong performance.'
  }
  if (spread < 1) {
    return 'Your scores are closely grouped — suggesting consistent rather than uneven civic performance.'
  }
  if (spread > 1.5) {
    return `Your scores show meaningful variation — ${highest.label} stands out relative to ${lowest.label}.`
  }
  return null
}

function buildClosingInsight(answers) {
  const scores = getScores(answers)
  if (stdDev(scores) < 1) {
    return 'Your responses suggest a community where issues are present, but not sharply polarized — challenges are likely shared rather than concentrated.'
  }
  return 'Your responses show meaningful differences across areas — some systems may be working better than others in your community.'
}

export default function CivicSurvey({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const total = TOPICS.length
  const isClosingStep = step === total
  const isResultsStep = step > total

  const topic = step < total ? TOPICS[step] : null

  function answer(fieldName, value) {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }))
  }

  function topicComplete() {
    if (!topic) return false
    const scaleAnswered = answers[topic.scale.fieldName] !== undefined
    const followUpAnswered = answers[topic.followUp.fieldName] !== undefined
    return scaleAnswered && followUpAnswered
  }

  function closingComplete() {
    return answers[CLOSING_FIELD] !== undefined
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
  if (isResultsStep) {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="results-screen">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Your Profile</div>
            <h2>Your Civic Alignment</h2>
            <p className="results-intro">Based on your answers across five civic domains.</p>

            <div className="results-grid">
              {TOPICS.map((t) => {
                const score = answers[t.scale.fieldName]
                const experience = answers[t.followUp.fieldName]
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
                    {experience && <div className="result-choice-text">{experience}</div>}
                  </div>
                )
              })}
            </div>

            {answers[CLOSING_FIELD] && (
              <div className="results-summary" style={{ marginTop: 16 }}>
                <h4>Where impact is being felt most: {answers[CLOSING_FIELD]}</h4>
                <p>This suggests recent changes or pressures in this area are more visible or immediate than others.</p>
              </div>
            )}

            {buildComparativeInsight(answers) && (
              <div className="results-summary">
                <p className="results-insight">{buildComparativeInsight(answers)}</p>
              </div>
            )}

            <div className="results-summary">
              <h4>Your alignment snapshot</h4>
              <p>{buildSnapshot(answers)}</p>
            </div>

            <div className="results-summary">
              <p className="results-insight">{buildClosingInsight(answers)}</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="results-actions">
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting\u2026' : 'Submit my responses'}
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

  // ── Closing question ────────────────────────────
  if (isClosingStep) {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="topic-step">
            <div className="survey-progress">
              <div className="progress-dots">
                {TOPICS.map((t, i) => (
                  <div key={t.id} className="progress-dot done" />
                ))}
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="topic-heading">
              <span style={{ fontSize: 28 }}>🗳️</span>
              <div>
                <div className="topic-num">Final Question</div>
                <h3>Biggest Impact</h3>
              </div>
            </div>

            <div className="question-block">
              <div className="question-text">
                Which of these issues has had the biggest impact on your daily life in the past year?
              </div>
              <div className="choice-options">
                {CLOSING_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`choice-btn ${answers[CLOSING_FIELD] === opt ? 'selected' : ''}`}
                    onClick={() => answer(CLOSING_FIELD, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-nav">
              <div>
                <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
              </div>
              <div className="survey-nav-right">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Final</span>
                <button
                  className="btn btn-primary"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!closingComplete()}
                >
                  See my results →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Topic step ──────────────────────────────────
  const scaleAnswered = answers[topic.scale.fieldName] !== undefined

  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Civic Survey</div>
          <h2>Community Alignment Survey</h2>
          <p className="diagnostic-instruction" style={{ marginTop: 12 }}>
            This survey focuses on your experiences and priorities in your community, not your political beliefs.
          </p>
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

          {/* Scale question */}
          <div className="question-block">
            <div className="question-text">{topic.scale.text}</div>
            {topic.id === 'economy' && (
              <div className="scale-instruct">Choose the option closest to your instinct — there are no perfect answers here.</div>
            )}
            <div className="scale-wrapper">
              {!topic.scale.labels && (
                <div className="scale-context">
                  1 = {topic.scale.lowLabel} &middot; 5 = {topic.scale.highLabel}
                </div>
              )}
              <div className={topic.scale.labels ? 'scale-options scale-options-labeled' : 'scale-options'}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${topic.scale.labels ? 'scale-btn-labeled' : 'scale-btn'} ${answers[topic.scale.fieldName] === n ? 'selected' : ''}`}
                    onClick={() => answer(topic.scale.fieldName, n)}
                  >
                    <span className="scale-btn-number">{n}</span>
                    {topic.scale.labels && (
                      <span className="scale-btn-label">{topic.scale.labels[n - 1]}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="scale-labels">
                <span className="scale-label-text">{topic.scale.lowLabel}</span>
                <span className="scale-label-text">{topic.scale.highLabel}</span>
              </div>
            </div>
          </div>

          {/* Follow-up — revealed after scale selection */}
          {scaleAnswered && (
            <div className="question-block">
              <div className="question-text">{topic.followUp.text}</div>
              <div className="choice-options">
                {topic.followUp.options.map((opt) => (
                  <button
                    key={opt}
                    className={`choice-btn ${answers[topic.followUp.fieldName] === opt ? 'selected' : ''} ${opt === 'Prefer not to say' ? 'choice-btn-secondary' : ''}`}
                    onClick={() => answer(topic.followUp.fieldName, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                {step === total - 1 ? 'Final question →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
