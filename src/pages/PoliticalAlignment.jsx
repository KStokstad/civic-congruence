import { useState } from 'react'
import { submitAlignment, updateAlignment, checkRepeatEmail } from '../services/airtable'
import { renderMarkdown } from '../utils/renderMarkdown'

const OPENING_INSTRUCTION = `This is not a personality quiz. It measures how you make tradeoffs under pressure.

Choose the answer you would accept in reality, not the one that sounds best.`

const QUESTIONS = [
  {
    id: 'q1', fieldName: 'Q1', airtableField: 'Role of Government',
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
    id: 'q2', fieldName: 'Q2', airtableField: 'Economic Fairness',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Economic Fairness',
    stem: 'When the gap between wealthy and lower-income Americans widens, your deeper concern is:',
    options: [
      { id: 'A',  text: 'That we\u2019re discouraging the risk-taking and innovation that drives economic growth.' },
      { id: 'B',  text: 'That concentrated wealth quietly erodes democratic participation and social trust.' },
      { id: 'C',  text: 'That both are real \u2014 but trying to solve both simultaneously usually produces ineffective policy.' },
      { id: 'D1', text: 'That absolute quality of life matters more than how wealth is distributed across groups.' },
      { id: 'D2', text: 'That this framing assumes a fixed pie \u2014 I reject the premise of the question.' },
    ],
  },
  {
    id: 'q3', fieldName: 'Q3', airtableField: 'Social Policy',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
    topic: 'Social Policy',
    stem: 'When it comes to social issues, the principle you\u2019d defend even under pressure is:',
    options: [
      { id: 'A',  text: 'Traditions and shared values that have held communities together over time deserve protection.' },
      { id: 'B',  text: 'Individual autonomy \u2014 people should live as they choose without interference from the state or majority opinion.' },
      { id: 'C',  text: 'Maintaining social cohesion sometimes requires limits on individual expression \u2014 that\u2019s an acceptable tradeoff.' },
      { id: 'D',  text: 'Most social conflict is downstream of economic insecurity \u2014 fix that first.' },
    ],
  },
  {
    id: 'q4', fieldName: 'Q4', airtableField: 'Institutions',
    topic: 'Institutions and Democracy',
    stem: 'Which position would you hold even if it made you unpopular?',
    options: [
      { id: 'A',  text: 'Our institutions have become self-serving and unaccountable \u2014 meaningful disruption is overdue.' },
      { id: 'B',  text: 'Imperfect institutions are still what stands between order and chaos \u2014 defend them.' },
      { id: 'C',  text: 'Serious reform is necessary, but tearing down institutions creates more problems than it solves.' },
      { id: 'D',  text: 'What matters is whether things work \u2014 institutional form is secondary.' },
    ],
  },
  {
    id: 'q5', fieldName: 'Q5', airtableField: 'Change and Stability',
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
    id: 'q6', fieldName: 'Q6', airtableField: 'Leadership',
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
    id: 'q7', fieldName: 'Q7', airtableField: 'Media and Information',
    topic: 'Media and Information',
    stem: 'How you actually navigate political information, honestly:',
    options: [
      { id: 'A',  text: 'I\u2019ve stopped trusting mainstream outlets \u2014 the bias is too consistent and too consequential.' },
      { id: 'B',  text: 'Independent and alternative sources have proven more honest to me than legacy media.' },
      { id: 'C',  text: 'I triangulate across sources \u2014 no single source is complete.' },
      { id: 'D1', text: 'I\u2019ve built my own filtering system over time and mostly trust my own judgment (I still engage with information).' },
      { id: 'D2', text: 'I\u2019ve largely disengaged from political news \u2014 the signal-to-noise ratio isn\u2019t worth it.' },
    ],
  },
  {
    id: 'q8', fieldName: 'Q8', airtableField: 'Identity and Politics',
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
    id: 'q9', fieldName: 'Q9', airtableField: 'Compromise',
    hint: 'You may find yourself agreeing with more than one option. Choose the one you would prioritize in practice.',
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

Produce exactly three outputs:

OUTPUT 1 — Core Orientation

Open with exactly three sentences following this structure:

Line 1 — Recognition: Describe what the respondent is doing or how they think, using "Your responses suggest" not "You are" or "You reject". Name the pattern without labeling it yet.

Line 2 — Pattern: Describe how their answers fit together — what the combination reveals about their underlying orientation. Use "Across your responses" or "A consistent pattern emerges."

Line 3 — Tension: Name where it gets complicated. Where do their values or instincts pull in different directions? This should feel like something they hadn't fully articulated. Use "This creates a tension between" or "This raises a question about."

After those three sentences, develop the full profile. You may now introduce specific patterns, institutional skepticism, identity framing, etc. — but earn that specificity rather than leading with it.

Replace all instances of "You reject," "You don't trust," "You see through" with "Your responses suggest," "You tend to," "A pattern emerges of."

Apply the 30% rule: before finalizing any section, ask if it can be said in fewer words without losing meaning. If yes, cut it.

When naming the orientation, introduce it with interpretive space rather than assertion: "One way to describe this orientation is [label]."

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

INTENSITY DISTRIBUTION RULE: Do not front-load heavy or charged language. Follow this progression:
- Core Orientation section: describe the pattern neutrally — no crisis, breakdown, or disruption language
- How You Evaluate Systems: introduce tension gently
- Section 3 onwards: escalate into implications and constraints
Replace reactive language like 'system is too broken' with grounded observations like 'you tend to interpret current systems as constrained in their ability to self-correct.' Same meaning, less resistance.

OUTPUT 2 — How You Evaluate Systems
Follow this exact sequence:
First paragraph: Mirror — describe what this person values or how they approach political decisions in a way that feels accurate and affirming. Use language like "your responses point to" or "across your answers a pattern emerges." Make them feel understood before anything else.
Second paragraph: Insight — name what that orientation reveals about how they process political decisions. Use "taken together, your responses point toward" or "one way to read this combination is." Avoid asserting coherence the user didn't claim — never say "what makes this coherent is."
Third paragraph: Tension — introduce the tradeoff or challenge this orientation creates as an open question rather than a confrontation. Instead of stating the problem directly, ask it: "This raises an open question: if [outcome], what ensures [value]?" Frame it as a natural consequence, not a flaw.
Fourth paragraph: add one concrete behavioral observation directly derived from the specific combination of answers this person gave — something that describes a recognizable behavior, not a generic trait. This should feel specific to their actual answers, not applicable to everyone. Format: "This can show up as [specific behavior] even when [contrasting outcome] might be possible."
End with one open question or observation that invites reflection rather than delivering a verdict.
Never open with critique. Never use accusatory language. Never say "You reject," "You believe," "You don't trust," or "You are." Always use "Your responses suggest," "A pattern emerges," "Taken together your responses point to," or "One way to describe this orientation is." The reader should think "that is accurate" before they encounter anything that challenges them.

OUTPUT 3 — Political Alignment Fit

This section does three things only:
1. Name where their responses sit relative to existing political categories
2. Explain why the mismatch occurs — as a structural difference, not a personal failing
3. Frame the gap as a property of how categories are built, not a verdict on the person

Open with: "Your responses don't align cleanly with any single political framework."

Follow immediately with: "This isn't because your views are inconsistent. It's because they follow a different structure than most political categories are built around."

Second paragraph — explain the structural difference: Most systems group positions based on shared ideology or coalition alignment. Describe how this person's responses are organized differently — around outcomes, constraints, or what they consider functionally viable. Use "by contrast" to mark the distinction.

Third paragraph — name the gap: "That difference creates a gap. It's not that your views don't fit anywhere — it's that they don't map cleanly onto how existing options are structured."

Optional fourth paragraph if the pattern warrants it: "This pattern often results in partial alignment across multiple positions without full identification with any of them. As a result, the available categories may feel incomplete, even when individual elements resonate."

Close with: "The key distinction is that your responses form a coherent system — they're just not organized in the same way most political frameworks are."

What to avoid in this section:
- Never say "You are politically homeless" or any variant — it's emotionally loaded and sounds absolute
- No broad critiques of parties or political systems
- Nothing that reads as your opinion or editorial judgment
- Do not use "homeless," "alienated," or "disillusioned"

Language rules:
- Anchor everything in structure: "how categories are built," "how existing options are structured," "a different organizational logic"
- If referencing alignment degree, use: "a low alignment fit with existing categories" — never "you don't belong"
- The reader should think: "the system isn't built to reflect this pattern" — not "I don't belong anywhere"

Do not include horizontal rule dividers (---) or standalone hash symbols (#) between sections. Use the section labels as the only visual separators.

Use Title Case for all section headers, not ALL CAPS. Headers should feel like steps in a diagnostic system, not essay headings. Each header should answer the question: what is this section doing for the reader?

Paragraph length: keep each paragraph to 2–4 sentences maximum. After every 2–3 paragraphs, insert a blank line to create visual breathing room. Use bold (**text**) sparingly — no more than 1–2 instances per section, only for genuinely load-bearing phrases.`

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

  const data = await res.json()
  return data.content[0].text
}

function parseAnalysis(text) {
  const o1 = text.match(/OUTPUT\s+1[^\n]*\n([\s\S]*?)(?=OUTPUT\s+2|$)/i)
  const o2 = text.match(/OUTPUT\s+2[^\n]*\n([\s\S]*?)(?=OUTPUT\s+3|$)/i)
  const o3 = text.match(/OUTPUT\s+3[^\n]*\n([\s\S]*?)$/i)
  return {
    label:     o1 ? o1[1].trim() : text,
    patterns:  o2 ? o2[1].trim() : null,
    alignment: o3 ? o3[1].trim() : null,
  }
}

const CURIOSITY_LINES = [
  "Most people with this pattern overlook one key tension.",
  "There\u2019s a tension in your responses that only shows up when analyzed together.",
  "Your answers point to something deeper than a typical political profile.",
]

function extractTopDomain(labelText, patternsText) {
  const combined = labelText + ' ' + (patternsText || '')
  const match = combined.match(/One way to describe this orientation is ([^.]+)/i)
  if (match) return match[1].trim()
  return null
}

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
            <p>10 questions about your political values. Takes about 4 minutes.</p>
          </div>
          <div className="diagnostic-instruction">
            <div className="instruction-icon">&#9888;</div>
            {OPENING_INSTRUCTION.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
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
    const { label, patterns, alignment } = parseAnalysis(analysis)
    const topDomain = extractTopDomain(label, patterns)
    const bridgeLine = topDomain
      ? `${topDomain} stands out. But that\u2019s not the full story.`
      : "Your responses stand out. But that\u2019s not the full story."

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
                {renderMarkdown(label)}
              </div>
            </div>

            {/* Output 2 — Behavioral Patterns */}
            {patterns && (
              <div className="analysis-section">
                <div className="analysis-section-header">
                  <span className="analysis-section-num">2</span>
                  Behavioral Patterns
                </div>
                <div className="analysis-paragraphs">
                  {renderMarkdown(patterns)}
                </div>
              </div>
            )}

            {/* Output 3 — Political Alignment Fit */}
            {alignment && (
              <div className="analysis-section">
                <div className="analysis-section-header">
                  <span className="analysis-section-num">3</span>
                  Political Alignment Fit
                </div>
                <div className="analysis-paragraphs">
                  {renderMarkdown(alignment)}
                </div>
              </div>
            )}

            {/* Full Report Checkout */}
            <div className="report-checkout">
              <h3>Get your full report</h3>
              <p className="report-checkout-hook">{bridgeLine}</p>
              <p className="report-checkout-body">
                Your responses reveal a deeper pattern in how you evaluate civic systems \u2014 where your views hold together, and where they come under tension.
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
                <p className="report-checkout-sent">2\u20133 minute read. Delivered instantly.</p>
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
