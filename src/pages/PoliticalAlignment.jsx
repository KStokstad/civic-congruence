import { useState } from 'react'
import { submitAlignment } from '../services/airtable'

const QUESTIONS = [
  {
    id: 'q1', fieldName: 'Q1',
    topic: 'Role of Government',
    stem: 'Which best describes your view on the role of government?',
    options: [
      { id: 'A', text: 'Government should be small, limited, and intervene only when absolutely necessary.' },
      { id: 'B', text: 'Government should actively correct market failures and protect vulnerable populations.' },
      { id: 'C', text: 'Government should be strong in some areas (security, infrastructure) and restrained in others.' },
      { id: 'D', text: 'I distrust both extremes and prefer pragmatic case-by-case solutions.' },
    ],
  },
  {
    id: 'q2', fieldName: 'Q2',
    topic: 'Economic Fairness',
    stem: 'When inequality increases, what concerns you more?',
    options: [
      { id: 'A', text: 'That incentives for growth and innovation are being undermined.' },
      { id: 'B', text: 'That wealth concentration erodes democracy and social stability.' },
      { id: 'C', text: 'That both can be true and policy must carefully balance them.' },
      { id: 'D', text: 'That inequality is less important than absolute living standards.' },
    ],
  },
  {
    id: 'q3', fieldName: 'Q3',
    topic: 'Social Issues',
    stem: 'Which statement best reflects your view on social policy?',
    options: [
      { id: 'A', text: 'Tradition and cultural continuity should guide policy.' },
      { id: 'B', text: 'Individual autonomy and civil rights should guide policy.' },
      { id: 'C', text: 'Social cohesion matters more than ideological purity.' },
      { id: 'D', text: 'These issues are overstated relative to economic concerns.' },
    ],
  },
  {
    id: 'q4', fieldName: 'Q4',
    topic: 'Institutions and Democracy',
    stem: 'Which statement best reflects your view on democratic institutions?',
    options: [
      { id: 'A', text: 'Institutions are bloated and unaccountable; disruption is necessary.' },
      { id: 'B', text: 'Institutions are imperfect but essential and must be protected.' },
      { id: 'C', text: 'Institutions need reform, but radical disruption is dangerous.' },
      { id: 'D', text: 'Institutions matter less than outcomes.' },
    ],
  },
  {
    id: 'q5', fieldName: 'Q5',
    topic: 'Change vs. Stability',
    stem: 'Your instinct in periods of political upheaval is to:',
    options: [
      { id: 'A', text: 'Push for rapid change.' },
      { id: 'B', text: 'Defend stability, even if progress slows.' },
      { id: 'C', text: 'Support incremental reform.' },
      { id: 'D', text: 'Step back and let systems self-correct.' },
    ],
  },
  {
    id: 'q6', fieldName: 'Q6',
    topic: 'Leadership Style',
    stem: 'Which leadership style do you most trust to govern well?',
    options: [
      { id: 'A', text: 'The decisive disruptor.' },
      { id: 'B', text: 'The empathetic consensus builder.' },
      { id: 'C', text: 'The technocratic problem-solver.' },
      { id: 'D', text: 'The principled outsider with limited power.' },
    ],
  },
  {
    id: 'q7', fieldName: 'Q7',
    topic: 'Media and Information',
    stem: 'Which best describes your relationship with media and information?',
    options: [
      { id: 'A', text: 'Mainstream media is largely unreliable.' },
      { id: 'B', text: 'Alternative media is more honest than traditional outlets.' },
      { id: 'C', text: 'All media has bias; triangulation is essential.' },
      { id: 'D', text: 'I disengage when coverage becomes performative.' },
    ],
  },
  {
    id: 'q8', fieldName: 'Q8',
    topic: 'Identity and Politics',
    stem: 'Should identity — race, gender, sexuality, lived experience — explicitly shape political representation and policy?',
    options: [
      { id: 'A', text: 'Yes, strongly.' },
      { id: 'B', text: 'Yes, but cautiously.' },
      { id: 'C', text: 'No, policy should be identity-neutral.' },
      { id: 'D', text: 'Identity politics does more harm than good.' },
    ],
  },
  {
    id: 'q9', fieldName: 'Q9',
    topic: 'Compromise',
    stem: 'In a divided system, compromise is:',
    options: [
      { id: 'A', text: 'Weakness.' },
      { id: 'B', text: 'Necessary but often misused.' },
      { id: 'C', text: 'Essential to democracy.' },
      { id: 'D', text: 'Only acceptable when core values are untouched.' },
    ],
  },
  {
    id: 'q10', fieldName: 'Q10',
    topic: 'Political Discomfort Test',
    stem: 'Which scenario makes you more uncomfortable?',
    options: [
      { id: 'A', text: 'A government that moves too fast and breaks norms.' },
      { id: 'B', text: 'A government that preserves norms but fails to act.' },
    ],
  },
]

async function callAnthropic(answers) {
  const answersText = QUESTIONS.map((q) => {
    const selected = q.options.find((o) => o.id === answers[q.fieldName])
    return `${q.topic}: ${selected ? `${selected.id}) ${selected.text}` : 'No answer'}`
  }).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are analyzing the political values of a survey respondent based on their answers to a 10-question political values diagnostic. Here are their responses:\n\n${answersText}\n\nWrite a 3-4 paragraph personalized political alignment analysis. Explain where this person aligns on the political spectrum, where they diverge from typical partisan patterns, and why their particular combination of views is notable. Be specific and analytical about their exact combination of answers — not generic. Avoid simple left/right labels; go deeper into the underlying values and tensions their answers reveal. Write directly to the person using "you" and "your".`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to generate analysis')
  }

  const data = await res.json()
  return data.content[0].text
}

export default function PoliticalAlignment({ onNavigate }) {
  const [step, setStep] = useState(0) // 0-9 = questions
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('questions') // 'questions' | 'generating' | 'results'
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState(null)

  const total = QUESTIONS.length
  const question = QUESTIONS[step]
  const currentAnswer = answers[question?.fieldName]

  function select(fieldName, optionId) {
    setAnswers((prev) => ({ ...prev, [fieldName]: optionId }))
  }

  async function handleFinish() {
    setPhase('generating')
    setError(null)
    try {
      const text = await callAnthropic(answers)
      setAnalysis(text)
      setPhase('results')
      // Save to Airtable in background — don't block UX
      const airtableFields = {
        'Submitted At': new Date().toISOString(),
        'Result': text,
      }
      QUESTIONS.forEach((q) => {
        const selected = q.options.find((o) => o.id === answers[q.fieldName])
        airtableFields[q.fieldName] = selected ? `${selected.id}: ${selected.text}` : ''
      })
      submitAlignment(airtableFields).catch(() => {})
    } catch (e) {
      setError(e.message)
      setPhase('questions')
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setPhase('questions')
    setAnalysis('')
    setError(null)
  }

  // ── Generating ──────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="generating-state">
            <div className="generating-spinner" />
            <h3>Analyzing your responses\u2026</h3>
            <p>Building a personalized political alignment analysis based on your 10 answers.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Results ─────────────────────────────────────
  if (phase === 'results') {
    const paragraphs = analysis.split(/\n\n+/).filter(Boolean)

    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="alignment-results" style={{ animation: 'fadeUp 0.3s ease' }}>
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>
              Your Analysis
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Your Political Alignment</h2>
            <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text)' }}>
              Based on your answers to 10 values questions.
            </p>

            <div className="analysis-content">
              <div className="analysis-paragraphs">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>

            {/* Full report teaser */}
            <div className="analysis-teaser">
              <div className="coming-soon-badge">Coming Soon</div>
              <h3>Get your full political alignment report</h3>
              <p>
                A deeper analysis delivered to your inbox — where you fit in the broader
                political landscape, what drives your views compared to others who answered
                similarly, and the issues most likely to shift your thinking.
              </p>
              <div className="teaser-form">
                <input
                  className="field-input"
                  type="email"
                  placeholder="your@email.com"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
                <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  Notify me when available
                </button>
              </div>
            </div>

            <div className="results-actions">
              <button className="btn btn-secondary" onClick={() => onNavigate('civic-survey')}>
                See how your community compares →
              </button>
              <button className="btn btn-ghost" onClick={reset}>Take it again</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Questions ───────────────────────────────────
  return (
    <div className="survey-page">
      <div className="container-sm">
        <div className="survey-header">
          <div className="section-label">Political Alignment</div>
          <h2>Values Diagnostic</h2>
          <p>10 questions about your political values. Takes about 4 minutes.</p>
        </div>

        <div className="topic-step" key={question.id}>
          {/* Progress */}
          <div className="alignment-progress-bar">
            <div className="alignment-progress-track">
              <div
                className="alignment-progress-fill"
                style={{ width: `${(step / total) * 100}%` }}
              />
            </div>
            <div className="alignment-progress-label">{step + 1} of {total}</div>
          </div>

          {/* Question */}
          <div className="alignment-question">
            <div className="alignment-topic-label">{question.topic}</div>
            <div className="question-text" style={{ fontSize: 18 }}>{question.stem}</div>
          </div>

          <div className="alignment-options">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${currentAnswer === opt.id ? 'selected' : ''}`}
                onClick={() => select(question.fieldName, opt.id)}
              >
                <span className="option-letter">{opt.id}</span>
                <span className="option-text">{opt.text}</span>
              </button>
            ))}
          </div>

          {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

          <div className="survey-nav" style={{ marginTop: 28 }}>
            <div>
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
                  \u2190 Back
                </button>
              )}
            </div>
            <div className="survey-nav-right">
              {step < total - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!currentAnswer}
                >
                  Next \u2192
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleFinish}
                  disabled={!currentAnswer}
                >
                  Get my analysis \u2192
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
