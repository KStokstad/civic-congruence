import { useState, useRef } from 'react'
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
PATTERN LABEL: A short identity label, 2-3 words maximum. e.g. "Institutional Skeptic". Precise, non-generic, not ideological. A behavioral description, not a political label. It should feel descriptive, not judgmental. Avoid labels that could feel politically loaded or alienating to the person receiving them — the label names a pattern, not a political identity. Do not append qualifiers or descriptors after the label — e.g. write "Pragmatic Skeptic" not "Pragmatic Skeptic with Structural Patience." Any further description belongs in PATTERN SUBLABEL, not here.
PATTERN SUBLABEL: A plain-language explanation of the label, 4-6 words, in everyday terms. e.g. "Reform-minded, but wary of power". Must be immediately understandable to a non-political person.
RECOGNITION SUMMARY: Exactly 2 sentences under 75 words total. The first sentence names the core pattern. The second sentence names the central tension. Use pattern language only: "your responses suggest," "a pattern emerges of." Do not use "you believe" or "you are." Do not repeat language that will appear in OUTPUT 1. Create curiosity, not closure.
TENSION: Write the central tension as a direct-address sentence starting with "You want." Use plain conversational language a non-political person would immediately understand. Avoid abstract nouns like "systemic", "institutional", "rupture", "paradigm". Do not use the phrase "distrusts the paths offered." Pattern: "You want [X], but don't trust [Y]." Example: "You want results, but don't trust the usual paths." Maximum 10 words.
Format exactly as:
PATTERN: [2-3 word label]
SUBLABEL: [4-6 word plain explanation]
SUMMARY: [2 sentences]
TENSION: [one sentence]

OUTPUT 1 — IDEOLOGICAL LABEL (SHORT)
Write exactly one paragraph. Maximum 4 sentences. 80-120 words total.
Purpose: Name the orientation. Explain what holds it together. Introduce the core tension.
Rules: Do not expand beyond one paragraph. Do not add additional sections. Do not fully explain the system. Maintain curiosity. End with an implied or explicit open loop.

OUTPUT 2 — WHERE THIS SHOWS UP
Write exactly 2-3 sentences describing one concrete behavioral pattern — how this orientation tends to manifest in real decisions or reactions.
Rules:
- Start with "You" — write as direct address to the person, not third-person pattern description
- Do not start with "This can show up as" or "A pattern worth noting is"
- Name one specific behavior, not a general trait
- Show a real-world implication or tension
- Example: "You may step back from political conversations not because you lack views, but because the terms of the debate feel flawed, performative, or unproductive."
- Plain language. No taxonomy.
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
  const patternMatch  = text.match(/^\*{0,2}PATTERN(?:\s+LABEL)?:\*{0,2}\s*(.+)/m)
  const sublabelMatch = text.match(/^\*{0,2}SUBLABEL:\*{0,2}\s*(.+)/m)
  const summaryMatch  = text.match(/^\*{0,2}(?:RECOGNITION\s+)?SUMMARY:\*{0,2}\s*([\s\S]+?)(?=\n\n|#{1,3}\s*OUTPUT\s+[12]|OUTPUT\s+[12]|TENSION:|$)/m)
  const tensionMatch  = text.match(/^\*{0,2}TENSION:\*{0,2}\s*(.+)/m)
  const tensionLine   = tensionMatch ? tensionMatch[1].trim() : null
  console.log('[PA tension]', tensionLine)
  const o1 = text.match(/#{0,3}\s*OUTPUT\s+1[^\n]*\n([\s\S]+?)(?=#{0,3}\s*OUTPUT\s+2|$)/i)
  const o2 = text.match(/#{0,3}\s*OUTPUT\s+2[^\n]*\n([\s\S]+?)(?=#{0,3}\s*OUTPUT\s+3|$)/i)
  return {
    patternLabel:    patternMatch  ? patternMatch[1].trim()  : null,
    patternSublabel: sublabelMatch ? sublabelMatch[1].trim() : null,
    recognitionSummary: summaryMatch ? summaryMatch[1].trim() : null,
    tensionLine,
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
  const shareCardRef = useRef(null)

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
          email: reportEmail || '',
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

  function firstSentence(text) {
    if (!text) return ''
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0].trim() : text.split('\n')[0].trim()
  }

  async function handleSaveImage() {
    if (!shareCardRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const w = shareCardRef.current.offsetWidth
    const canvas = await html2canvas(shareCardRef.current, { scale: 2, width: w, height: w, backgroundColor: null, useCORS: true })
    canvas.toBlob(async (blob) => {
      if (!blob) return

      if (navigator.canShare) {
        const file = new File([blob], 'civic-congruence-result.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] })
            return
          } catch (_) {}
        }
      }

      const reader = new FileReader()
      reader.onload = function(e) {
        const link = document.createElement('a')
        link.href = e.target.result
        link.download = 'civic-congruence-result.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      reader.readAsDataURL(blob)
    })
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
      <div className="pa-landing">

        {/* HERO */}
        <div className="cs-hero">
          <div className="cs-hero-circle cs-hero-circle--1" />
          <div className="cs-hero-circle cs-hero-circle--2" />
          <div className="cs-hero-circle cs-hero-circle--3" />
          <div className="cs-hero-content">
            <p className="cs-eyebrow">POLITICAL ALIGNMENT</p>
            <h1 className="cs-hero-h1">Not left or right.<br /><em>Specific.</em></h1>
            <p className="cs-hero-sub">Most political surveys put you on a spectrum. Civic Congruence maps the actual texture of your thinking — where your values are consistent, where they&rsquo;re in tension, and what that reveals about how you see the role of government.</p>
            <button
              className="cs-hero-cta"
              onClick={() => setPhase('questions')}
            >
              Start the 4-minute diagnostic
            </button>
            <p className="cs-hero-note">Free &middot; Private &middot; No registration</p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="pa-how-section">
          <div className="container">
            <div className="pa-steps-grid">
              <div className="home-signal-card">
                <div className="home-signal-card-heading">1</div>
                <p className="home-signal-card-bold">Answer 10 values questions.</p>
                <p className="home-signal-card-body">Real tradeoffs, no right answers. Choose what you would actually do under pressure.</p>
              </div>
              <div className="home-signal-card">
                <div className="home-signal-card-heading">2</div>
                <p className="home-signal-card-bold">Get your alignment type.</p>
                <p className="home-signal-card-body">One of 12 behavioral patterns, named for how you decide — not for what party you vote for.</p>
              </div>
              <div className="home-signal-card">
                <div className="home-signal-card-heading">3</div>
                <p className="home-signal-card-bold">See where you fit.</p>
                <p className="home-signal-card-body">Compare your type to the broader Civic Congruence respondent pool.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SAMPLE RESULT */}
        <section className="pa-sample-section">
          <div className="container">
            <div className="pa-section-header pa-section-header--sample">
              <h2 className="pa-section-h2">What your result<br /><em className="pa-section-h2-gold">looks like</em></h2>
            </div>
            <div className="pa-sample-card">
              <div className="home-hero-circle home-hero-circle--large" />
              <div className="home-hero-circle home-hero-circle--medium" />
              <div className="home-hero-circle home-hero-circle--small" />
              <div className="pa-sample-inner">
                <p className="pa-sample-eyebrow">Political Alignment Result</p>
                <h3 className="pa-sample-title">
                  <span className="pa-sample-title-main">Protective Disruption</span>
                  <br />
                  <span className="pa-sample-title-sub">Under Expert Control</span>
                </h3>
                <p className="pa-sample-sub">
                  Strong interventionist instincts, skeptical of the institutions that would do the intervening.
                </p>
                <div className="pa-sample-stats">
                  <div className="pa-stat">
                    <div className="pa-stat-val">6%</div>
                    <div className="pa-stat-label">of respondents</div>
                  </div>
                  <div className="pa-stat">
                    <div className="pa-stat-val">2nd</div>
                    <div className="pa-stat-label">rarest type</div>
                  </div>
                  <div className="pa-stat">
                    <div className="pa-stat-val">1 of 12</div>
                    <div className="pa-stat-label">pattern types</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE 12 TYPES */}
        <section className="pa-types-section">
          <div className="container">
            <div className="pa-section-header">
              <p className="pa-section-eyebrow">The 12 Alignment Types</p>
              <h2 className="pa-section-h2">Every result is <em>distinct</em></h2>
            </div>
            <div className="pa-types-grid">
              <div className="pa-type-card">
                <div className="pa-type-name">Civic Minimalist</div>
                <p className="pa-type-desc">Skeptical that large institutional structures solve local problems. Prefers direct accountability over coordinated systems.</p>
                <div className="pa-type-rarity">18% of respondents</div>
              </div>
              <div className="pa-type-card">
                <div className="pa-type-name">Structural Reformer</div>
                <p className="pa-type-desc">Believes lasting change runs through democratic institutions, even when they move slowly.</p>
                <div className="pa-type-rarity">12% of respondents</div>
              </div>
              <div className="pa-type-card">
                <div className="pa-type-name">Pragmatic Bridge-Builder</div>
                <p className="pa-type-desc">Values outcomes over doctrine. Adjusts position based on evidence and context rather than fixed alignment.</p>
                <div className="pa-type-rarity">22% of respondents</div>
              </div>
              <div className="pa-type-card">
                <div className="pa-type-name">Principled Dissenter</div>
                <p className="pa-type-desc">Consistent values applied to an inconsistent system. Skeptical of party loyalty in both directions.</p>
                <div className="pa-type-rarity">9% of respondents</div>
              </div>
            </div>
          </div>
        </section>

        {/* PULL QUOTE */}
        <section className="pa-quote-section">
          <div className="container">
            <blockquote className="pa-quote">
              <p className="pa-quote-text">
                &ldquo;You&rsquo;ve probably sat in a policy meeting thinking: this could be solved in two weeks if someone with actual authority just made a decision.&rdquo;
              </p>
              <cite className="pa-quote-attribution">
                From a Protective Disruption result &mdash; Civic Congruence
              </cite>
            </blockquote>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="pa-entry-section">
          <div className="container-sm">
            <div className="pa-closing-card">
              <p className="pa-closing-eyebrow">Beyond opinion. Into signal.</p>
              <h2 className="pa-closing-h2">Find out where you <em>actually</em> stand</h2>
              <p className="pa-closing-sub">Ten questions. A result precise enough to share.</p>
              <button
                className="btn pa-cta-btn"
                style={{ width: '100%', maxWidth: 400 }}
                onClick={() => setPhase('questions')}
              >
                Start the 4-minute diagnostic
              </button>
              <p className="pa-closing-note">Free &middot; Private &middot; Results in under 4 minutes</p>
            </div>
          </div>
        </section>

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
    const { patternLabel, patternSublabel, recognitionSummary, tensionLine, label, behaviorSignal } = parseAnalysis(analysis)
    console.log('[PA parsed]', { patternLabel, recognitionSummary, tensionLine, label, behaviorSignal })
    const transitionLine = patternLabel
      ? `${patternLabel} shows up more clearly under pressure. The full report breaks down how this pattern holds together, and where it starts to strain.`
      : "Your pattern shows up more clearly under pressure. The full report breaks down how it holds together, and where it starts to strain."

    // Placeholder rarity — TODO: replace with real type frequency from Airtable
    const rarityPct = 6
    // ≤10%: rarity is a hook — show badge
    // 11–25%: not compelling — hide badge
    // ≥26%: shift to specificity — show "1 of 12 patterns"
    const rarityBadgeText = rarityPct <= 10
      ? `Top ${rarityPct}% rarest`
      : rarityPct <= 25
      ? null
      : '1 of 12 patterns'

    // Placeholder distribution data — TODO: wire up real type frequency data from Airtable
    const DIST_VISIBLE = [
      { name: 'Pragmatic Bridge-Builder', pct: 22, isUser: false },
      { name: 'Civic Minimalist', pct: 18, isUser: false },
      { name: patternLabel || 'Your Type', pct: rarityPct, isUser: true },
    ]
    const DIST_BLURRED = [
      { name: 'Structural Reformer', pct: 12 },
      { name: 'Principled Dissenter', pct: 9 },
      { name: 'Constructive Realist', pct: 8 },
    ]
    const MAX_PCT = 22

    return (
      <div className="pa-results-page">
        <div className="slim-hero">
          <div className="slim-hero-circle slim-hero-circle--1" />
          <div className="slim-hero-circle slim-hero-circle--2" />
          <div className="slim-hero-content">
            <p className="slim-hero-eyebrow">YOUR ANALYSIS</p>
            <h1 className="slim-hero-h1">Your Political Alignment</h1>
            <p className="slim-hero-sub">Based on your answers to 10 values questions.</p>
          </div>
        </div>
        <div className="pa-results-wrap">

          {/* 2. RARITY STRIP */}
          <div className="pa-rarity-strip">
            <div className="pa-rarity-stat">
              <div className="pa-rarity-val" style={{ color: 'rgba(240, 234, 224, 0.95)' }}>{rarityPct}%</div>
              <div className="pa-rarity-label">Shared by {rarityPct}% of respondents</div>
            </div>
            <div className="pa-rarity-divider" />
            <div className="pa-rarity-stat">
              <div className="pa-rarity-val" style={{ color: 'rgba(240, 234, 224, 0.95)' }}>2nd</div>
              <div className="pa-rarity-label">Rarest Pattern</div>
            </div>
            <div className="pa-rarity-divider" />
            <div className="pa-rarity-stat">
              <div className="pa-rarity-val" style={{ color: 'rgba(240, 234, 224, 0.95)' }}>1 of 12</div>
              <div className="pa-rarity-label">Patterns</div>
            </div>
          </div>

          {/* 4. RECOGNITION QUOTE */}
          {(tensionLine || recognitionSummary) && (
            <div className="pa-quote-card">
              <p className="pa-quote-card-text">{tensionLine || firstSentence(behaviorSignal) || firstSentence(recognitionSummary)}</p>
              <p className="pa-quote-card-attr">Pattern Recognition &mdash; What This Looks Like in Practice</p>
            </div>
          )}

          {/* 5. INSIGHT CARDS */}
          <div className="pa-insight-grid">
            {/* Card 1 — Hero: Ideological Pattern */}
            <div className="pa-insight-card pa-insight-card--hero">
              <div className="pa-insight-hero-name">{patternLabel || '—'}</div>
              <div className="pa-insight-hero-desc">{firstSentence(label) || '—'}</div>
              <div className="pa-insight-stat">{rarityBadgeText || `Shared by ${rarityPct}% of respondents`}</div>
            </div>

            {/* Card 2 — Where This Shows Up */}
            <div className="pa-insight-card">
              <div className="pa-insight-label">WHERE THIS SHOWS UP</div>
              <div className="pa-insight-body">{firstSentence(behaviorSignal) || '—'}</div>
              <div className="pa-insight-stat">Seen in {rarityPct}% of all results</div>
            </div>

            {/* Card 3 — Common In */}
            <div className="pa-insight-card">
              <div className="pa-insight-label">COMMON IN</div>
              <div className="pa-insight-body">{firstSentence(recognitionSummary) || '—'}</div>
              <div className="pa-insight-stat">Most common in your area</div>
            </div>

            {/* Card 4 — The Central Tension */}
            <div className="pa-insight-card">
              <div className="pa-insight-label">THE CENTRAL TENSION</div>
              <div className="pa-insight-body">{tensionLine || '—'}</div>
              <div className="pa-insight-stat">Shared by {rarityPct}% of respondents</div>
            </div>
          </div>

          {/* 6. SHARE CARD + BUTTONS */}
          {patternLabel && (
            <div className="pa-share-section">
              <p className="pa-share-label">Share Your Result</p>
              <div className="pa-share-card" ref={shareCardRef}>
                <div className="pa-share-circle pa-share-circle--lg" />
                <div className="pa-share-circle pa-share-circle--md" />
                <div className="pa-share-circle pa-share-circle--sm" />
                <div className="pa-share-card-inner">
                  <div className="pa-share-card-top">
                    <div className="pa-share-eyebrow">My Civic Pattern</div>
                    <div className="pa-share-subhead">Civic Congruence · Political Alignment</div>
                  </div>
                  <div className="pa-share-card-middle">
                    <div className="pa-share-pattern">{tensionLine || '—'}</div>
                    <div className="pa-share-type-label">{patternLabel || '—'}</div>
                    {rarityBadgeText && (
                      <div className="pa-share-rarity-badge">{rarityBadgeText}</div>
                    )}
                  </div>
                  <div className="pa-share-card-bottom">
                    <div className="pa-share-cta-pill">Find your civic pattern → civiccongruence.org</div>
                  </div>
                </div>
              </div>
              <div className="pa-share-btns">
                <button className="pa-share-btn pa-share-btn--dark" onClick={handleSaveImage}>
                  Share image
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                Every shared pattern helps reveal where public trust is strained.
              </p>
            </div>
          )}

          {/* 7. DISTRIBUTION CHART */}
          <div className="pa-dist-card">
            <div className="pa-dist-header">
              <span className="pa-dist-title">How your type compares</span>
              <span className="pa-dist-link">Full breakdown &rarr;</span>
            </div>
            <div className="pa-dist-rows">
              {DIST_VISIBLE.map((t) => (
                <div className="pa-dist-row" key={t.name}>
                  <span className={`pa-dist-label${t.isUser ? ' pa-dist-label--user' : ''}`}>{t.name}</span>
                  <div className="pa-dist-track">
                    <div
                      className="pa-dist-fill"
                      style={{
                        width: `${(t.pct / MAX_PCT) * 82}%`,
                        background: t.isUser ? 'var(--gold)' : 'var(--border)',
                      }}
                    />
                  </div>
                  <span className={`pa-dist-pct${t.isUser ? ' pa-dist-pct--user' : ''}`}>{t.pct}%</span>
                </div>
              ))}
            </div>
            <div className="pa-dist-gated">
              {DIST_BLURRED.map((t) => (
                <div className="pa-dist-row pa-dist-row--muted" key={t.name}>
                  <span className="pa-dist-label">{t.name}</span>
                  <div className="pa-dist-track">
                    <div className="pa-dist-fill" style={{ width: `${(t.pct / MAX_PCT) * 82}%`, background: 'var(--border)' }} />
                  </div>
                  <span className="pa-dist-pct">{t.pct}%</span>
                </div>
              ))}
              <div className="pa-dist-overlay">
                Full breakdown of all types included in the full report
              </div>
            </div>
          </div>

          {/* 8. UPSELL BLOCK — checkout logic unchanged */}
          <div className="pa-upsell-block">
            <div className="pa-upsell-left">
              <p className="pa-upsell-eyebrow">Full Report</p>
              <h3 className="pa-upsell-h3">Where this pattern holds &mdash; and where it breaks</h3>
              <p className="pa-upsell-body" style={{ color: 'rgba(160, 144, 112, 0.8)' }}>Your full report breaks down why this pattern shows up, where it works, where it strains, and what to watch under pressure.</p>
            </div>
            <div className="pa-upsell-right">
              <div className="pa-upsell-price">$7</div>
              <p className="pa-upsell-delivery">Full report delivered instantly</p>
              {checkoutError && (
                <div className="error-banner" style={{ marginTop: 8 }}>{checkoutError}</div>
              )}
              <button
                className="pa-upsell-btn"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Redirecting…' : 'Get full report — $7'}
              </button>
            </div>
          </div>

          {/* 8. BOTTOM BUTTONS */}
          <div className="pa-bottom-btns">
            <button className="pa-bottom-btn" onClick={() => onNavigate('civic-survey')}>
              See how your community compares &#8594;
            </button>
            <button className="pa-bottom-btn" onClick={reset}>Take it again</button>
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
