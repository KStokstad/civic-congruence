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
      { id: 'D2', text: 'I\u2019ve largely disengaged from political news \u2014 the signal-to-noise ratio isn\u2019t worth it.' },
    ],
  },
  {
    id: 'q8', fieldName: 'Q8', airtableField: 'Identity and Politics',
    topic: 'Identity and Politics',
    stem: 'Which position would you defend in a room that disagreed with you?',
    options: [
      { id: 'A',  text: 'Lived experience is political knowledge. Identity should substantially shape policy and representation.' },
      { id: 'B',  text: 'Identity matters, but it shouldn\u2019t override other considerations \u2014 it\u2019s one input among many.' },
      { id: 'C',  text: 'Policy should be designed around needs and outcomes, not group membership.' },
      { id: 'D',  text: 'Identity-based politics has become counterproductive \u2014 it creates more division than insight.' },
    ],
  },
  {
    id: 'q9', fieldName: 'Q9', airtableField: 'Compromise',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Compromise',
    stem: 'In a divided system, which position would you actually hold under pressure?',
    options: [
      { id: 'A',  text: 'Compromise signals weak conviction \u2014 real leadership means holding the line.' },
      { id: 'B',  text: 'Compromise on tactics is necessary \u2014 compromise on core values is capitulation. The difference matters.' },
      { id: 'C',  text: 'Compromise is the basic requirement of democratic governance \u2014 without it, nothing functions.' },
      { id: 'D1', text: 'Whether to compromise depends entirely on what\u2019s being traded \u2014 values versus tactics are different things.' },
      { id: 'D2', text: 'The system is too broken for compromise to matter \u2014 the premise no longer applies.' },
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

Produce exactly two outputs:

OUTPUT 0 — RECOGNITION SUMMARY
Generate two things:

PATTERN LABEL: A 4-6 word phrase that names the core orientation. Should feel precise and non-generic. Not a political label — a behavioral description. Example: "Stability-Oriented Institutional Pragmatist" or "Crisis-Responsive Reform Defender"

RECOGNITION SUMMARY: Write exactly 2 sentences. First sentence: name the core pattern in one plain observation. Second sentence: name the central tension only — do not restate or expand the pattern. Total must be under 50 words. Do not explain or justify. Create curiosity, not closure.

The SUMMARY must not restate or paraphrase the PATTERN LABEL. The label names what it is. The summary names the tension it creates. These are different jobs.

Use pattern language only — "your responses suggest," "across your answers," "a pattern emerges of." No jargon, no framework terms, no assertive identity language. No "you believe" or "you are." Do not repeat language that will appear in OUTPUT 1.

Format your response exactly as:
PATTERN: [label here]
SUMMARY: [2 sentences here]

OUTPUT 1 — Core Orientation

Open OUTPUT 1 with exactly 2-3 sentences that create immediate recognition before any label or analytical framing. These sentences must:
- Use pattern language not assertion: "your responses point to someone who..." or "across your answers, a pattern emerges of..." — never "you believe" or "you reject"
- Name the core tension in plain everyday language — no jargon, no framework terms
- Make the reader think "that's exactly how I think" before they encounter any analysis
- Be derived from the most distinctive combination of answers, not generic observations

Example format:
"Your responses point to someone who sees institutions as necessary but not sufficient — worth defending, but not worth protecting from the pressure needed to make them move. Across your answers, a pattern emerges of wanting systems that can actually deliver, not just systems that survive."

After these 2-3 opening sentences, introduce the ideological label and explanation as currently structured.

Open with exactly three sentences following this structure:

Line 1 — Recognition: Describe what the respondent is doing or how they think, using "Your responses suggest" not "You are" or "You reject". Name the pattern without labeling it yet.

Line 2 — Pattern: Describe how their answers fit together — what the combination reveals about their underlying orientation. Use "Across your responses" or "A consistent pattern emerges."

Line 3 — Tension: Name where it gets complicated. Where do their values or instincts pull in different directions? This should feel like something they hadn't fully articulated. Use "This creates a tension between" or "This raises a question about."

After those three sentences, develop the full profile. You may now introduce specific patterns, institutional skepticism, identity framing, etc. — but earn that specificity rather than leading with it.

Replace all instances of "You reject," "You don't trust," "You see through" with "Your responses suggest," "You tend to," "A pattern emerges of."

Apply the 30% rule: before finalizing any section, ask if it can be said in fewer words without losing meaning. If yes, cut it.

When naming the orientation, introduce it with interpretive space rather than assertion: "One way to describe this orientation is [label]."

Write exactly one paragraph for this section. Maximum 4 sentences. Name the orientation, explain what holds it together, and name the core tension. Do not add additional paragraphs.

The standard: the first 3-5 lines should make the reader think "that's exactly it" — not "that's interesting" and not "that's a lot."

PATTERN PRECISION RULE — applies to every section:

Do not include specific behavioral examples or situational guesses about what the person does in daily life.

Instead, describe:
- The internal logic of their pattern (why their answers hold together)
- The tradeoff that pattern creates (what it gives them, what it costs)
- Where the pattern holds and where it breaks

Format for precision:
'Your responses consistently [pattern]. This creates [what it enables]. As a result, [what it limits or complicates].'

The goal is for the reader to think: 'That is exactly how I think, even if I wouldn't have said it that way' — not 'that sounds like something I might do.'

The difference:
- Too generic: 'You value outcomes over process'
- Too behavioral: 'When a policy is proposed, you tend to...'
- Correct: 'Your responses consistently prioritize whether something works over how it is structured. That creates a clear standard, but it narrows the range of approaches that register as legitimate.'

INTENSITY DISTRIBUTION RULE: Describe the pattern neutrally. No crisis, breakdown, or disruption language. Replace reactive language like 'system is too broken' with grounded observations like 'you tend to interpret current systems as constrained in their ability to self-correct.' Same meaning, less resistance.

CROSS-ANSWER SYNTHESIS RULES — apply to every output:

The first paragraph must show how the answers interact with each other — not what they were individually. Lead with a combined insight that could only emerge from seeing all 10 answers together. Never restate individual answer selections.

Include 1-2 observations that are only visible when the answers are considered together — patterns or tensions that wouldn't be apparent from any single answer. Work these naturally into the analysis. Only label explicitly if it adds clarity: 'What stands out when these are combined:...'

Each paragraph must be 2-3 sentences maximum. No dense blocks. If a paragraph exceeds 3 sentences, split it.

Remove all filler phrases: 'in the current landscape,' 'what stands out is,' 'taken together' (limit to once per output), 'it's worth noting.' Cut any sentence that could be removed without losing meaning.

Each output must contain exactly one central idea per section. If two ideas appear, move the second to where it belongs or cut it.

Include one sharp, surprising observation per output — something the reader wouldn't have said about themselves but will recognize as true when they read it. This should emerge from an unexpected combination of answers, not from generic pattern description.

REPETITION RULE: Before finalizing any section, check whether the core idea has already appeared in a previous section. If yes, either cut it or advance it — show a new implication, not the same point restated. Every paragraph must add information that was not present in any prior paragraph. If a paragraph could be removed without losing meaning, remove it.

Do not include any # symbols, --- dividers, or markdown section markers between sections. Do not use ## or # for section headers. Sections should flow as continuous prose separated only by paragraph breaks. No horizontal rules, no hash symbols, no markdown dividers of any kind.

Paragraph length: keep each paragraph to 2–4 sentences maximum. After every 2–3 paragraphs, insert a blank line to create visual breathing room. Use bold (**text**) sparingly — no more than 1–2 instances per section, only for genuinely load-bearing phrases.

Avoid em-dashes throughout. Use periods, commas, or restructure the sentence instead. Em-dashes create visual noise and interrupt reading flow. If you find yourself writing an em-dash, rewrite the sentence to eliminate it.`

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
  const patternMatch = text.match(/^PATTERN:\s*(.+)/m)
  const summaryMatch = text.match(/^SUMMARY:\s*([\s\S]+?)(?=\n\n|OUTPUT\s+1|$)/m)
  const o1 = text.match(/OUTPUT\s+1[^\n]*\n([\s\S]*?)$/i)
  return {
    patternLabel:       patternMatch ? patternMatch[1].trim() : null,
    recognitionSummary: summaryMatch ? summaryMatch[1].trim() : null,
    label:     o1 ? o1[1].trim() : text,
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
    const { patternLabel, recognitionSummary, label } = parseAnalysis(analysis)
    const hookLine = patternLabel
      ? `${patternLabel}. The full report unpacks what holds this pattern together and where it creates tension.`
      : "Your responses point to a distinctive pattern. The full report unpacks what holds it together and where it creates tension."

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

            {/* Full Report Checkout */}
            <div className="report-checkout">
              <p className="report-checkout-invite">Want to go deeper?</p>
              <h3>Get your full report</h3>
              <p className="report-checkout-hook">{renderInline(hookLine, 'hook')}</p>
              <p className="report-checkout-body">
                Your responses reveal a deeper pattern in how you evaluate civic systems: where your views hold together, and where they come under tension.
              </p>
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
                <p className="report-checkout-sent">2–3 minute read. Delivered instantly.</p>
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
