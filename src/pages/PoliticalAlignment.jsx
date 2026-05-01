import { useState } from 'react'
import { submitAlignment, updateAlignment, checkRepeatEmail } from '../services/airtable'
import { renderMarkdown, renderInline } from '../utils/renderMarkdown'

const OPENING_INSTRUCTION_LINES = [
  'The Values Diagnostic shows you how you decide when two of your values collide. It forces real choices because every question has a downside, so there’s no right answer, only the one you’d actually act on. The result is a map of your decision-making pattern under pressure, not a personality quiz.',
]

// INSTRUMENT DESIGN RULES — do not modify question text without review
// Protect: "volatile", "under pressure", "even if unpopular", "even knowing its downside"
// These create psychological commitment and cannot be softened
// Answer choices must preserve real tradeoffs — do not make both options equally comfortable
// Phrases like "some overreach is inevitable" and "some needs go unmet" are intentional
// Any stem tightening must improve clarity without reducing precision or emotional weight
const QUESTIONS = [
  {
    id: 'q1', fieldName: 'Q1', airtableField: 'Role of Government',
    topic: 'Role of Government',
    stem: 'When you think about the proper scope of government, which would you accept even knowing its downside?',
    options: [
      { id: 'A',  text: 'Government stays limited. Some needs go unmet, but autonomy and efficiency are preserved.' },
      { id: 'B',  text: 'Government actively intervenes. Some overreach is inevitable, but vulnerable people get protection.' },
      { id: 'C',  text: 'Government is strong on core functions, restrained elsewhere. The hard part is deciding which is which.' },
      { id: 'D',  text: 'I reject fixed frameworks. Good governance is situational, not ideological.' },
    ],
  },
  {
    id: 'q2', fieldName: 'Q2', airtableField: 'Economic Fairness',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Economic Fairness',
    stem: 'When inequality increases, what concerns you more?',
    options: [
      { id: 'A',  text: 'That we\u2019re discouraging the risk-taking and innovation that drives economic growth.' },
      { id: 'B',  text: 'That concentrated wealth quietly erodes democratic participation and social trust.' },
      { id: 'C',  text: 'That both are real, but trying to solve both simultaneously usually produces ineffective policy.' },
      { id: 'D1', text: 'That absolute quality of life matters more than how wealth is distributed across groups.' },
      { id: 'D2', text: 'That this framing assumes a fixed pie. I reject the premise of the question.' },
    ],
  },
  {
    id: 'q3', fieldName: 'Q3', airtableField: 'Social Policy',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Social Policy',
    stem: 'On social issues, which principle would you defend even under pressure?',
    options: [
      { id: 'A',  text: 'Traditions and shared values that have held communities together over time deserve protection.' },
      { id: 'B',  text: 'Individual autonomy: people should live as they choose without interference from the state or majority opinion.' },
      { id: 'C',  text: 'Maintaining social cohesion sometimes requires limits on individual expression. That\u2019s an acceptable tradeoff.' },
      { id: 'D',  text: 'Most social conflict is downstream of economic insecurity. Fix that first.' },
    ],
  },
  {
    id: 'q4', fieldName: 'Q4', airtableField: 'Institutions',
    topic: 'Institutions and Democracy',
    stem: 'Which position would you hold even if it made you unpopular?',
    options: [
      { id: 'A',  text: 'Our institutions have become self-serving and unaccountable. Meaningful disruption is overdue.' },
      { id: 'B',  text: 'Imperfect institutions are still what stands between order and chaos. Defend them.' },
      { id: 'C',  text: 'Serious reform is necessary, but tearing down institutions creates more problems than it solves.' },
      { id: 'D',  text: 'What matters is whether things work. Institutional form is secondary.' },
    ],
  },
  {
    id: 'q5', fieldName: 'Q5', airtableField: 'Change and Stability',
    topic: 'Change and Stability',
    stem: 'When things feel politically unstable, what position would you stand behind?',
    options: [
      { id: 'A',  text: 'Push harder. Crises create openings for change that stability never allows.' },
      { id: 'B',  text: 'Hold the line. Preserving stability matters more than advancing any agenda right now.' },
      { id: 'C',  text: 'Work incrementally. Change that lasts has to be built carefully, even when it\u2019s frustrating.' },
      { id: 'D',  text: 'Step back. Overcorrecting in turbulent times usually makes things worse.' },
    ],
  },
  {
    id: 'q6', fieldName: 'Q6', airtableField: 'Leadership',
    topic: 'Leadership',
    stem: 'Which leader would you trust with real power, knowing the risks?',
    options: [
      { id: 'A',  text: 'The decisive disruptor: breaks with convention, forces issues others avoid.' },
      { id: 'B',  text: 'The empathetic consensus builder: listens, brings people along, builds coalitions.' },
      { id: 'C',  text: 'The technocratic problem-solver: evidence-based, expert, less concerned with politics.' },
      { id: 'D',  text: 'The principled outsider: limited power, independent, accountable to no establishment.' },
    ],
  },
  {
    id: 'q7', fieldName: 'Q7', airtableField: 'Media and Information',
    topic: 'Media and Information',
    stem: 'How do you actually navigate political information, honestly?',
    options: [
      { id: 'A',  text: 'I\u2019ve stopped trusting mainstream outlets. The bias is too consistent and too consequential.' },
      { id: 'B',  text: 'Independent and alternative sources have proven more honest to me than legacy media.' },
      { id: 'C',  text: 'I triangulate across sources. No single source is complete.' },
      { id: 'D1', text: 'I\u2019ve built my own filtering system over time and mostly trust my own judgment (I still engage with information).' },
      { id: 'D2', text: 'I\u2019ve largely disengaged from political news. The signal-to-noise ratio isn\u2019t worth it.' },
    ],
  },
  {
    id: 'q8', fieldName: 'Q8', airtableField: 'Identity and Politics',
    topic: 'Identity and Politics',
    stem: 'Which position would you defend in a room that disagreed with you?',
    options: [
      { id: 'A',  text: 'Lived experience is political knowledge. Identity should substantially shape policy and representation.' },
      { id: 'B',  text: 'Identity matters, but it shouldn\u2019t override other considerations. It\u2019s one input among many.' },
      { id: 'C',  text: 'Policy should be designed around needs and outcomes, not group membership.' },
      { id: 'D',  text: 'Identity-based politics has become counterproductive. It creates more division than insight.' },
    ],
  },
  {
    id: 'q9', fieldName: 'Q9', airtableField: 'Compromise',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Compromise',
    stem: 'In a divided system, which position would you actually hold under pressure?',
    options: [
      { id: 'A',  text: 'Compromise signals weak conviction. Real leadership means holding the line.' },
      { id: 'B',  text: 'Compromise on tactics is necessary, but compromise on core values is capitulation. The difference matters.' },
      { id: 'C',  text: 'Compromise is the basic requirement of democratic governance. Without it, nothing functions.' },
      { id: 'D1', text: 'Whether to compromise depends entirely on what\u2019s being traded. Values versus tactics are different things.' },
      { id: 'D2', text: 'The system is too broken for compromise to matter. The premise no longer applies.' },
    ],
  },
  {
    id: 'q10', fieldName: 'Q10', airtableField: 'Political Discomfort',
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

  const prompt = `You are analyzing a political values diagnostic for Civic Congruence. The respondent completed a 10-question diagnostic designed to surface how they make tradeoffs under pressure.

Here are their answers:
${answersText}

Generate a structured analysis with two tiers: FREE OUTPUT only. Do not generate PAID OUTPUT in this call.

FREE OUTPUT

OUTPUT 0 — RECOGNITION SUMMARY
PATTERN LABEL: A 4-6 word phrase that names the core orientation. Precise, non-generic, not ideological. A behavioral description, not a political label.
RECOGNITION SUMMARY: Exactly 2 sentences under 75 words total. The first sentence names the core pattern. The second sentence names the central tension. Use pattern language only: "your responses suggest," "a pattern emerges of." Do not use "you believe" or "you are." Do not repeat language that will appear in OUTPUT 1. Create curiosity, not closure.
Format exactly as:
PATTERN: [label]
SUMMARY: [text]

OUTPUT 1 — IDEOLOGICAL LABEL (SHORT)
Write exactly one paragraph. Maximum 4 sentences. 80-120 words total.
Purpose: Name the orientation. Explain what holds it together. Introduce the core tension.
Rules: Do not expand beyond one paragraph. Do not add additional sections. Do not fully explain the system. Maintain curiosity. End with an implied or explicit open loop.

OUTPUT 2 — WHERE THIS SHOWS UP
Write exactly 2-3 sentences describing one concrete behavioral pattern — how this orientation tends to manifest in real decisions or reactions.
Rules:
- Name one specific behavior, not a general trait
- Show a real-world implication or tension
- Use pattern language: "this can show up as," "a pattern worth noting is," "your responses suggest this tends to manifest as"
- Do not introduce new frameworks or expand into analysis
- Do not repeat what was said in OUTPUT 0 or OUTPUT 1
- This should make the reader think: "Oh, that's actually true about how I respond"

GENERAL RULES
Use pattern language, not identity claims. Avoid ideological labels unless explicitly qualified. FREE OUTPUT must create curiosity, not closure. FREE OUTPUT must be significantly shorter than any full analysis. Do not generate any PAID OUTPUT sections in this response. Avoid em-dashes throughout. Use periods, commas, or restructure instead.

Do not use markdown formatting in your response. Do not use ## headers, ** bold markers, or # symbols. Use plain text only. Format the response exactly as specified with plain PATTERN: and SUMMARY: labels.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    let err = {}
    const rawText = await res.text().catch(() => '')
    try { err = JSON.parse(rawText) } catch (_) {}
    console.error('Anthropic API error', {
      status: res.status,
      statusText: res.statusText,
      body: err,
      raw: rawText,
    })
    const msg = err?.error?.message || `HTTP ${res.status} ${res.statusText}`
    throw new Error(`Anthropic API: ${msg}`)
  }

  console.log('PA API call complete')
  const data = await res.json()
  const raw = data.content[0].text
  console.log('[PA raw response]', raw)
  return raw.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function parseAnalysis(text) {
  const patternMatch = text.match(/^\*{0,2}PATTERN(?:\s+LABEL)?:\*{0,2}\s*(.+)/m)
  const summaryMatch = text.match(/^\*{0,2}(?:RECOGNITION\s+)?SUMMARY:\*{0,2}\s*([\s\S]+?)(?=\n\n|#{1,3}\s*OUTPUT\s+[12]|OUTPUT\s+[12]|$)/m)
  const o1 = text.match(/#{0,3}\s*OUTPUT\s+1[^\n]*\n([\s\S]+?)(?=#{0,3}\s*OUTPUT\s+2|$)/i)
  const o2 = text.match(/#{0,3}\s*OUTPUT\s+2[^\n]*\n([\s\S]+?)(?=#{0,3}\s*OUTPUT\s+3|$)/i)
  return {
    patternLabel:       patternMatch ? patternMatch[1].trim() : null,
    recognitionSummary: summaryMatch ? summaryMatch[1].trim() : null,
    label:          o1 ? o1[1].trim() : text,
    behaviorSignal: o2 ? o2[1].trim() : null,
  }
}

const CURIOSITY_LINES = [
  "Most people with this pattern overlook one key tension.",
  "There\u2019s a tension in your responses that only shows up when analyzed together.",
  "Your answers point to something deeper than a typical political profile.",
]

export default function PoliticalAlignment({ onNavigate }) {
  const [phase, setPhase] = useState('intro') // 'intro' | 'questions' | 'generating' | 'results'
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState(null)
  const [airtableRecordId, setAirtableRecordId] = useState(null)
  const [reportEmail, setReportEmail] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [curiosityIdx] = useState(() => Math.floor(Math.random() * CURIOSITY_LINES.length))

  const total = QUESTIONS.length
  const question = QUESTIONS[step]
  const currentAnswer = answers[question?.fieldName]

  function select(fieldName, optionId) {
    setAnswers((prev) => ({ ...prev, [fieldName]: optionId }))
  }

  function buildAirtableFields(text) {
    const fields = { 'Submitted At': new Date().toISOString(), 'Result': text, 'Repeat Submission': false }
    QUESTIONS.forEach((q) => {
      const selected = q.options.find((o) => o.id === answers[q.fieldName])
      fields[q.airtableField] = selected ? `${selected.id}: ${selected.text}` : ''
    })
    return fields
  }

  async function saveAlignmentRecord(text) {
    try {
      const record = await submitAlignment(buildAirtableFields(text))
      const id = record?.id ?? null
      console.log('Alignment record saved, id:', id)
      setAirtableRecordId(id)
      return id
    } catch (err) {
      console.error('Alignment Airtable save failed:', err.message)
      return null
    }
  }

  async function handleFinish() {
    setPhase('generating')
    setError(null)
    try {
      const text = await callAnthropic(answers)
      setAnalysis(text)
      setPhase('results')
      saveAlignmentRecord(text) // fire and log — don't block showing results
    } catch (e) {
      setError(e.message)
      setPhase('questions')
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const sessionId = crypto.randomUUID()

      // Ensure the Airtable record exists before proceeding
      let recordId = airtableRecordId
      if (!recordId) {
        console.log('No record ID yet — saving alignment record now')
        recordId = await saveAlignmentRecord(analysis)
      }

      // Duplicate email check — flag repeat submissions without blocking purchase
      const isRepeat = await checkRepeatEmail(reportEmail).catch(() => false)
      if (isRepeat) {
        console.warn('Repeat submission detected for:', reportEmail)
        if (recordId) {
          updateAlignment(recordId, { 'Repeat Submission': true }).catch((e) =>
            console.error('Failed to flag repeat submission:', e.message)
          )
        }
      }

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reportEmail,
          sessionId,
          alignmentData: answers,
          airtableRecordId: recordId,
        }),
      })

      const rawText = await res.text()
      console.log('create-checkout response', res.status, rawText)

      if (!res.ok) {
        let message = `HTTP ${res.status}`
        try {
          const err = JSON.parse(rawText)
          message = err.error || err.message || JSON.stringify(err)
        } catch {
          message = rawText || message
        }
        throw new Error(message)
      }

      const { url } = JSON.parse(rawText)
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      setCheckoutError(err.message)
      setCheckoutLoading(false)
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setPhase('intro')
    setAnalysis('')
    setError(null)
    setAirtableRecordId(null)
    setReportEmail('')
    setCheckoutLoading(false)
    setCheckoutError(null)
  }

  // ── Intro ───────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="survey-header">
            <div className="section-label">Political Alignment</div>
            <h2>Values Diagnostic</h2>
            <div className="diagnostic-instruction">
              <p>{OPENING_INSTRUCTION_LINES.join(' ')}</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12, marginTop: 0 }}>
              Most options will feel partially true. Choose the answer you would accept in reality,<br />not the one that sounds best.
            </p>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', maxWidth: 360 }}
              onClick={() => setPhase('questions')}
            >
              Start the 4-minute diagnostic
            </button>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
              Private. Your responses aren&rsquo;t shared.
            </p>
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
    const { patternLabel, recognitionSummary, label, behaviorSignal } = parseAnalysis(analysis)
    console.log('[PA parsed]', { patternLabel, recognitionSummary, label, behaviorSignal })
    const transitionLine = patternLabel
      ? `${patternLabel} shows up more clearly under pressure. The full report breaks down how this pattern holds together, and where it starts to strain.`
      : "Your pattern shows up more clearly under pressure. The full report breaks down how it holds together, and where it starts to strain."

    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="alignment-results">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Your Analysis</div>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Your Political Alignment</h2>
            <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text)' }}>
              Based on your answers to 10 values questions.
            </p>

            {/* Output 0 — Recognition Card */}
            {(patternLabel || recognitionSummary) && (
              <div className="recognition-card">
                {patternLabel && (
                  <div className="recognition-card-label">{patternLabel}</div>
                )}
                {recognitionSummary && (
                  <p className="recognition-card-summary">{renderInline(recognitionSummary, 'rec')}</p>
                )}
              </div>
            )}
            <div className="recognition-divider-wrap">
              <hr className="recognition-divider-line" />
              <div className="recognition-divider">Full analysis below ↓</div>
            </div>

            {/* Output 1 — Ideological Label */}
            <div className="analysis-section">
              <div className="analysis-section-header">
                <span className="analysis-section-num">1</span>
                Ideological Label
              </div>
              <div className="analysis-paragraphs">
                {renderMarkdown(label)}
              </div>
            </div>

            {/* Output 2 — Where This Shows Up */}
            {behaviorSignal && (
              <div className="analysis-section">
                <div className="analysis-section-header">
                  <span className="analysis-section-num">2</span>
                  Where This Shows Up
                </div>
                <div className="analysis-paragraphs">
                  {renderMarkdown(behaviorSignal)}
                </div>
              </div>
            )}

            {/* Full Report Checkout */}
            <div className="report-checkout">
              <p className="report-checkout-transition">{renderInline(transitionLine, 'transition')}</p>
              <div className="report-checkout-deeper">
                <p className="report-checkout-deeper-label">Inside, you'll see:</p>
                <ul>
                  <li>Why this pattern shows up in your responses</li>
                  <li>Where your thinking is consistent vs under pressure</li>
                  <li>What kinds of systems align with your approach</li>
                  <li>Where blind spots may emerge</li>
                </ul>
              </div>
              <p className="report-checkout-curiosity">{CURIOSITY_LINES[curiosityIdx]}</p>
              <div className="report-checkout-form">
                <div className="field-group">
                  <label className="field-label" htmlFor="report-email">
                    Where should we send your report?
                  </label>
                  <input
                    id="report-email"
                    className="field-input"
                    type="email"
                    placeholder="your@email.com"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                  />
                </div>
                {checkoutError && (
                  <div className="error-banner" style={{ marginTop: 8 }}>{checkoutError}</div>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !reportEmail}
                  style={{ marginTop: 12 }}
                >
                  {checkoutLoading ? 'Redirecting\u2026' : 'See your full report \u2014 $7'}
                </button>
                <p className="report-checkout-sent">A structured breakdown of how your thinking holds under pressure, where it works, and where it breaks. Delivered instantly.</p>
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

          {question.hint && (
            <p className="question-hint">{question.hint}</p>
          )}

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
