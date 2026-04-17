import { useState } from 'react'
import { submitAlignment } from '../services/airtable'

const OPENING_INSTRUCTION =
  'Several of these questions involve real tradeoffs \u2014 there\u2019s no cost-free answer. Choose the option you would accept even knowing its downside.'

const QUESTIONS = [
  {
    id: 'q1', fieldName: 'Q1',
    topic: 'Role of Government',
    stem: 'When you think about the proper scope of government, which would you accept even knowing its downside?',
    options: [
      { id: 'A',  text: 'Government stays limited \u2014 some needs go unmet, but autonomy and efficiency are preserved.' },
      { id: 'B',  text: 'Government actively intervenes \u2014 some overreach is inevitable, but vulnerable people get protection.' },
      { id: 'C',  text: 'Government is strong on core functions, restrained elsewhere \u2014 the hard part is deciding which is which.' },
      { id: 'D',  text: 'I reject fixed frameworks \u2014 good governance is situational, not ideological.' },
    ],
  },
  {
    id: 'q2', fieldName: 'Q2',
    topic: 'Economic Fairness',
    stem: 'When the gap between wealthy and lower-income Americans widens, your deeper concern is:',
    options: [
      { id: 'A',  text: 'That we\u2019re discouraging the risk-taking and innovation that drives shared prosperity.' },
      { id: 'B',  text: 'That concentrated wealth quietly erodes democratic participation and social trust.' },
      { id: 'C',  text: 'That both are real \u2014 but trying to solve both simultaneously usually produces ineffective policy.' },
      { id: 'D1', text: 'That absolute quality of life matters more than how wealth is distributed across groups.' },
      { id: 'D2', text: 'That this framing assumes a fixed pie \u2014 I reject the premise of the question.' },
    ],
  },
  {
    id: 'q3', fieldName: 'Q3',
    topic: 'Social Policy',
    stem: 'When it comes to social issues, the principle you\u2019d defend even under pressure is:',
    options: [
      { id: 'A',  text: 'Traditions and shared values that have held communities together over time deserve protection.' },
      { id: 'B',  text: 'Individual autonomy \u2014 people should live as they choose without interference from the state or majority opinion.' },
      { id: 'C',  text: 'Maintaining social cohesion sometimes requires limiting individual expression \u2014 that\u2019s an acceptable tradeoff.' },
      { id: 'D',  text: 'Most social conflict is downstream of economic insecurity \u2014 fix that first.' },
    ],
  },
  {
    id: 'q4', fieldName: 'Q4',
    topic: 'Institutions and Democracy',
    stem: 'Which position would you hold even if it made you unpopular?',
    options: [
      { id: 'A',  text: 'Our institutions have become self-serving and unaccountable \u2014 meaningful disruption is overdue.' },
      { id: 'B',  text: 'Imperfect institutions are still what stands between order and chaos \u2014 defend them.' },
      { id: 'C',  text: 'Serious reform is necessary, but tearing down institutions creates more problems than it solves.' },
      { id: 'D',  text: 'What matters is outcomes \u2014 institutional form is secondary to whether things actually work.' },
    ],
  },
  {
    id: 'q5', fieldName: 'Q5',
    topic: 'Change and Stability',
    stem: 'When the political environment feels volatile, the position you\u2019d stand behind is:',
    options: [
      { id: 'A',  text: 'Push harder \u2014 crises create openings for change that stability never allows.' },
      { id: 'B',  text: 'Hold the line \u2014 preserving stability matters more than advancing any agenda right now.' },
      { id: 'C',  text: 'Work incrementally \u2014 change that lasts has to be built carefully, even when it\u2019s frustrating.' },
      { id: 'D',  text: 'Step back \u2014 overcorrecting in turbulent times usually makes things worse.' },
    ],
  },
  {
    id: 'q6', fieldName: 'Q6',
    topic: 'Leadership',
    stem: 'The leader you\u2019d trust with real power, knowing the risks:',
    options: [
      { id: 'A',  text: 'The decisive disruptor \u2014 breaks with convention, forces issues others avoid.' },
      { id: 'B',  text: 'The empathetic consensus builder \u2014 listens, brings people along, builds coalitions.' },
      { id: 'C',  text: 'The technocratic problem-solver \u2014 evidence-based, expert, less concerned with politics.' },
      { id: 'D',  text: 'The principled outsider \u2014 limited power, independent, accountable to no establishment.' },
    ],
  },
  {
    id: 'q7', fieldName: 'Q7',
    topic: 'Media and Information',
    stem: 'How you actually navigate political information, honestly:',
    options: [
      { id: 'A',  text: 'I\u2019ve stopped trusting mainstream outlets \u2014 the bias is too consistent and too consequential.' },
      { id: 'B',  text: 'Independent and alternative sources have proven more honest to me than legacy media.' },
      { id: 'C',  text: 'I triangulate across sources \u2014 I\u2019ve accepted I\u2019ll never have a complete picture and act accordingly.' },
      { id: 'D1', text: 'I\u2019ve built my own filtering system over time and mostly trust my own judgment.' },
      { id: 'D2', text: 'I\u2019ve largely disengaged from political news \u2014 the signal-to-noise ratio isn\u2019t worth it.' },
    ],
  },
  {
    id: 'q8', fieldName: 'Q8',
    topic: 'Identity and Politics',
    stem: 'Which position would you defend in a room that disagreed with you?',
    options: [
      { id: 'A',  text: 'Lived experience is political knowledge \u2014 identity should substantially shape policy and representation.' },
      { id: 'B',  text: 'Identity matters, but it shouldn\u2019t override other considerations \u2014 it\u2019s one input among many.' },
      { id: 'C',  text: 'Policy should be designed around needs and outcomes, not group membership.' },
      { id: 'D',  text: 'Identity-based politics has become counterproductive \u2014 it creates more division than insight.' },
    ],
  },
  {
    id: 'q9', fieldName: 'Q9',
    topic: 'Compromise',
    stem: 'In a divided system, the position you\u2019d actually hold under pressure:',
    options: [
      { id: 'A',  text: 'Compromise signals weak conviction \u2014 real leadership means holding the line.' },
      { id: 'B',  text: 'Compromise on tactics is necessary \u2014 compromise on core values is capitulation. The difference matters.' },
      { id: 'C',  text: 'Compromise is the basic requirement of democratic governance \u2014 without it, nothing functions.' },
      { id: 'D1', text: 'Whether to compromise depends entirely on what\u2019s being traded \u2014 values versus tactics are different things.' },
      { id: 'D2', text: 'The system is too broken for compromise to matter \u2014 the premise no longer applies.' },
    ],
  },
  {
    id: 'q10', fieldName: 'Q10',
    topic: 'Political Discomfort',
    stem: 'Which scenario genuinely worries you more?',
    options: [
      { id: 'A',  text: 'A government that moves aggressively, breaks with established norms, and causes lasting institutional damage.' },
      { id: 'B',  text: 'A government so committed to procedure and stability that it fails to act when action is desperately needed.' },
    ],
  },
]

async function callAnthropic(answers) {
  const answersText = QUESTIONS.map((q) => {
    const selected = q.options.find((o) => o.id === answers[q.fieldName])
    return `${q.topic}: ${selected ? `${selected.id}) ${selected.text}` : 'No answer'}`
  }).join('\n')

  const prompt = `You are analyzing the political values of a survey respondent. They were told upfront: "Several of these questions involve real tradeoffs — there's no cost-free answer. Choose the option you would accept even knowing its downside." Here are their 10 responses:\n\n${answersText}\n\nProvide your analysis in exactly this format — two sections, no deviation:\n\nOUTPUT 1 — IDEOLOGICAL LABEL\nA specific 2-3 sentence label for this person's political orientation. Avoid generic terms like "moderate" or "centrist." Be specific and honest about what their answers actually reveal. Follow with 2-3 sentences of plain language explanation of what drives this orientation.\n\nOUTPUT 2 — BEHAVIORAL PATTERNS\nDo NOT label them politically here. Identify 3 specific behavioral tendencies revealed by their answers. Frame each as a separate line starting with "You consistently..." describing behavior and the condition that triggers it. If their answers show internal tension or contradiction, name it directly — that's useful data. Be analytical, not flattering.`

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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to generate analysis')
  }

  const data = await res.json()
  return data.content[0].text
}

function parseAnalysis(text) {
  const o1 = text.match(/OUTPUT\s+1[^\n]*\n([\s\S]*?)(?=OUTPUT\s+2|$)/i)
  const o2 = text.match(/OUTPUT\s+2[^\n]*\n([\s\S]*?)$/i)
  return {
    label:    o1 ? o1[1].trim() : text,
    patterns: o2 ? o2[1].trim() : null,
  }
}

export default function PoliticalAlignment({ onNavigate }) {
  const [phase, setPhase] = useState('intro') // 'intro' | 'questions' | 'generating' | 'results'
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
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
      const airtableFields = { 'Submitted At': new Date().toISOString(), 'Result': text }
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
    setPhase('intro')
    setAnalysis('')
    setError(null)
  }

  // ── Intro ───────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="survey-header">
            <div className="section-label">Political Alignment</div>
            <h2>Values Diagnostic</h2>
            <p>10 questions about your political values. Takes about 4 minutes.</p>
          </div>
          <div className="diagnostic-instruction">
            <div className="instruction-icon">&#9888;</div>
            <p>{OPENING_INSTRUCTION}</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-primary btn-lg" onClick={() => setPhase('questions')}>
              Begin diagnostic &#8594;
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Generating ──────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="generating-state">
            <div className="generating-spinner" />
            <h3>Analyzing your responses&#8230;</h3>
            <p>Building a personalized political alignment analysis based on your 10 answers.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Results ─────────────────────────────────────
  if (phase === 'results') {
    const { label, patterns } = parseAnalysis(analysis)
    const labelParas  = label.split(/\n\n+/).filter(Boolean)
    const patternLines = patterns ? patterns.split(/\n+/).filter((l) => l.trim()) : []

    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="alignment-results">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Your Analysis</div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Your Political Alignment</h2>
            <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text)' }}>
              Based on your answers to 10 values questions.
            </p>

            {/* Output 1 — Ideological Label */}
            <div className="analysis-section">
              <div className="analysis-section-header">
                <span className="analysis-section-num">1</span>
                Ideological Label
              </div>
              <div className="analysis-paragraphs">
                {labelParas.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>

            {/* Output 2 — Behavioral Patterns */}
            {patternLines.length > 0 && (
              <div className="analysis-section">
                <div className="analysis-section-header">
                  <span className="analysis-section-num">2</span>
                  Behavioral Patterns
                </div>
                <ul className="pattern-list">
                  {patternLines.map((line, i) => (
                    <li key={i} className="pattern-item">{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Teaser */}
            <div className="analysis-teaser">
              <div className="coming-soon-badge">Coming Soon</div>
              <h3>Want to go deeper?</h3>
              <p>
                Your full report includes historical context for your profile, which policy
                areas show unexpected cross-partisan alignment, and what your pattern suggests
                about how you&#8217;d respond to the major challenges facing local governance.
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
                  Notify me
                </button>
              </div>
            </div>

            <div className="results-actions">
              <button className="btn btn-secondary" onClick={() => onNavigate('civic-survey')}>
                See how your community compares &#8594;
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
        <div className="topic-step" key={question.id}>

          <div className="alignment-progress-bar">
            <div className="alignment-progress-track">
              <div className="alignment-progress-fill" style={{ width: `${(step / total) * 100}%` }} />
            </div>
            <div className="alignment-progress-label">{step + 1} of {total}</div>
          </div>

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
              {step > 0
                ? <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>&#8592; Back</button>
                : <button className="btn btn-ghost" onClick={() => setPhase('intro')}>&#8592; Instructions</button>
              }
            </div>
            <div className="survey-nav-right">
              {step < total - 1 ? (
                <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!currentAnswer}>
                  Next &#8594;
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={handleFinish} disabled={!currentAnswer}>
                  Get my analysis &#8594;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
