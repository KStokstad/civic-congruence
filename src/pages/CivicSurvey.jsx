import { useState } from 'react'
import { submitSurvey } from '../services/airtable'

const EXPERIENCE_OPTIONS = [
  'Yes, it affected me directly',
  'Yes, someone in my household',
  'No direct impact',
  'No strong lean either way',
]

const TOPICS = [
  {
    id: 'economy',
    label: 'Economy',
    icon: '📊',
    scale: {
      text: 'In your day-to-day experience, when tradeoffs have to be made in your community — where do you lean?',
      lowLabel: 'Keep the economy growing, even if household costs stay high',
      highLabel: 'Lower costs for households, even if growth slows',
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
      text: 'Based on what you\u2019ve seen locally, when tradeoffs have to be made — where do you lean?',
      lowLabel: 'Focus on enforcement and accountability, even if prevention programs get less funding',
      highLabel: 'Invest in prevention and root causes, even if enforcement stays limited',
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
      text: 'In the past year, has a safety issue — crime, violence, an unsafe situation, lack of emergency response — directly affected you or someone in your household?',
      options: EXPERIENCE_OPTIONS,
      fieldName: 'Safety Experience',
    },
  },
  {
    id: 'health',
    label: 'Health',
    icon: '🏥',
    scale: {
      text: 'Thinking about your community\u2019s health system, when tradeoffs have to be made — where do you lean?',
      lowLabel: 'Expand access to more people, even if quality varies',
      highLabel: 'Maintain quality of care, even if not everyone can access it',
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
      text: 'Based on what you see in your community\u2019s schools, when tradeoffs have to be made — where do you lean?',
      lowLabel: 'Hold to common standards, even if local needs differ',
      highLabel: 'Give schools local flexibility, even if outcomes vary',
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
      text: 'Thinking about local decisions that affect your community — how confident are you that they actually reflect what people need?',
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

const TOPIC_IMPLICATIONS = {
  Economy:    'The economic situation here may be placing more visible pressure on daily life than other areas reflect.',
  Safety:     'The safety situation here may be creating more tangible uncertainty than other civic systems in your responses.',
  Health:     'Health access or outcomes here may be generating more immediate strain than other areas suggest.',
  Education:  'The education situation here may be producing more acute concern than other domains currently show.',
  Governance: 'Trust in governance here may be more fractured than other areas in your responses indicate.',
}

function buildSnapshot(answers) {
  const scores = getScores(answers)
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const highest = sorted[sorted.length - 1]
  const lowest = sorted[0]
  const spread = highest.score - lowest.score

  const label = spread > 1.5
    ? 'CONCENTRATED CONCERN'
    : spread >= 0.5
    ? 'MIXED EXPERIENCE'
    : 'CONSISTENT ACROSS AREAS'

  return {
    label,
    headline: `${highest.label} is your strongest signal`,
    detail: `Highest: ${highest.label} (${highest.score}/5) \u00b7 Lowest: ${lowest.label} (${lowest.score}/5)`,
  }
}

function buildStatement2(answers) {
  const scores = getScores(answers)
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const spread = sorted[sorted.length - 1].score - sorted[0].score

  if (spread < 1) {
    return `Your scores show close alignment across areas — pressure is relatively distributed.`
  } else if (spread <= 2) {
    return `Your scores show moderate variation, indicating selective pressure points rather than system-wide dissatisfaction.`
  } else {
    return `Your scores show significant variation — some areas are functioning considerably better than others in your responses.`
  }
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

            <h4 className="results-group-header">Your alignment snapshot</h4>
            {(() => {
              const snap = buildSnapshot(answers)
              return (
                <div className="results-insight-group">
                  <div className="results-summary results-summary--primary">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{snap.label}</p>
                    <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-h)', margin: '0 0 4px' }}>{snap.headline}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{snap.detail}</p>
                  </div>
                  <div className="results-summary results-summary--secondary">
                    <p>{buildStatement2(answers)}</p>
                  </div>
                </div>
              )
            })()}

            {error && <div className="error-banner">{error}</div>}

            <div className="results-actions">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 12px' }}>
                This is a preview. Submit to save your responses to the community dataset.
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving\u2026' : 'Save my responses \u2192'}
              </button>
              <button
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', opacity: 0.6, cursor: 'pointer', padding: '4px 0' }}
                onClick={reset}
              >
                Start over
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

        {step === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
            There are no right answers. Choose what feels closest to your experience, even if it&rsquo;s not perfect.
          </p>
        )}

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
            <div className="scale-wrapper">
              <p className="scale-range-hint">Select a point on the scale between the two options below.</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '-4px 0 8px' }}>If you&rsquo;re unsure, go with your first instinct.</p>
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

          {/* Follow-up hint — shown before scale is answered */}
          {!scaleAnswered && (
            <p className="followup-hint">A follow-up question will appear after you select.</p>
          )}

          {/* Follow-up — revealed after scale selection */}
          {scaleAnswered && (
            <div className="question-block question-block--fade-in">
              <div className="question-text">{topic.followUp.text}</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-8px 0 12px' }}>
                Most people feel somewhere in between. Just choose the closest option.
              </p>
              <div className="choice-options">
                {topic.followUp.options.map((opt) => (
                  <button
                    key={opt}
                    className={`choice-btn ${answers[topic.followUp.fieldName] === opt ? 'selected' : ''} ${opt === 'No strong lean either way' ? 'choice-btn-secondary' : ''}`}
                    onClick={() => answer(topic.followUp.fieldName, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional notes — revealed after scale selection */}
          {scaleAnswered && (
            <div className="topic-notes-block question-block--fade-in">
              <label className="topic-notes-label" htmlFor={`notes-${topic.id}`}>
                Anything else about {topic.label} in your community? (optional)
              </label>
              <textarea
                id={`notes-${topic.id}`}
                className="topic-notes-textarea"
                rows={2}
                value={answers[`${topic.label} Notes`] || ''}
                onChange={(e) => answer(`${topic.label} Notes`, e.target.value)}
                placeholder="Optional — share any additional context here."
              />
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
