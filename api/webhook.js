import Stripe from 'stripe'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

const airtableBase = () => `https://api.airtable.com/v0/${process.env.VITE_AIRTABLE_BASE_ID}`

const QUESTIONS = [
  { fieldName: 'Q1',  topic: 'Role of Government',   options: { A: 'Government stays limited — some needs go unmet, but autonomy and efficiency are preserved.', B: 'Government actively intervenes — some overreach is inevitable, but vulnerable people get protection.', C: 'Government is strong on core functions, restrained elsewhere — the hard part is deciding which is which.', D: 'I reject fixed frameworks — good governance is situational, not ideological.' } },
  { fieldName: 'Q2',  topic: 'Economic Fairness',     options: { A: "We're discouraging the risk-taking and innovation that drives shared prosperity.", B: 'Concentrated wealth quietly erodes democratic participation and social trust.', C: 'Both are real — but trying to solve both simultaneously usually produces ineffective policy.', D1: 'Absolute quality of life matters more than how wealth is distributed across groups.', D2: 'This framing assumes a fixed pie — I reject the premise of the question.' } },
  { fieldName: 'Q3',  topic: 'Social Policy',         options: { A: 'Traditions and shared values that have held communities together over time deserve protection.', B: 'Individual autonomy — people should live as they choose without interference from the state or majority opinion.', C: "Maintaining social cohesion sometimes requires limiting individual expression — that's an acceptable tradeoff.", D: 'Most social conflict is downstream of economic insecurity — fix that first.' } },
  { fieldName: 'Q4',  topic: 'Institutions',          options: { A: 'Our institutions have become self-serving and unaccountable — meaningful disruption is overdue.', B: 'Imperfect institutions are still what stands between order and chaos — defend them.', C: 'Serious reform is necessary, but tearing down institutions creates more problems than it solves.', D: 'What matters is outcomes — institutional form is secondary to whether things actually work.' } },
  { fieldName: 'Q5',  topic: 'Change and Stability',  options: { A: 'Push harder — crises create openings for change that stability never allows.', B: 'Hold the line — preserving stability matters more than advancing any agenda right now.', C: "Work incrementally — change that lasts has to be built carefully, even when it's frustrating.", D: 'Step back — overcorrecting in turbulent times usually makes things worse.' } },
  { fieldName: 'Q6',  topic: 'Leadership',             options: { A: 'The decisive disruptor — breaks with convention, forces issues others avoid.', B: 'The empathetic consensus builder — listens, brings people along, builds coalitions.', C: 'The technocratic problem-solver — evidence-based, expert, less concerned with politics.', D: 'The principled outsider — limited power, independent, accountable to no establishment.' } },
  { fieldName: 'Q7',  topic: 'Media and Information', options: { A: "I've stopped trusting mainstream outlets — the bias is too consistent and too consequential.", B: 'Independent and alternative sources have proven more honest to me than legacy media.', C: "I triangulate across sources — I've accepted I'll never have a complete picture and act accordingly.", D1: "I've built my own filtering system over time and mostly trust my own judgment.", D2: "I've largely disengaged from political news — the signal-to-noise ratio isn't worth it." } },
  { fieldName: 'Q8',  topic: 'Identity and Politics', options: { A: 'Lived experience is political knowledge — identity should substantially shape policy and representation.', B: "Identity matters, but it shouldn't override other considerations — it's one input among many.", C: 'Policy should be designed around needs and outcomes, not group membership.', D: 'Identity-based politics has become counterproductive — it creates more division than insight.' } },
  { fieldName: 'Q9',  topic: 'Compromise',             options: { A: 'Compromise signals weak conviction — real leadership means holding the line.', B: 'Compromise on tactics is necessary — compromise on core values is capitulation. The difference matters.', C: 'Compromise is the basic requirement of democratic governance — without it, nothing functions.', D1: "Whether to compromise depends entirely on what's being traded — values versus tactics are different things.", D2: 'The system is too broken for compromise to matter — the premise no longer applies.' } },
  { fieldName: 'Q10', topic: 'Political Discomfort',  options: { A: 'A government that moves aggressively, breaks with established norms, and causes lasting institutional damage.', B: 'A government so committed to procedure and stability that it fails to act when action is desperately needed.' } },
]

function formatAnswers(alignmentData) {
  return QUESTIONS.map((q) => {
    const choice = alignmentData[q.fieldName]
    const text = choice ? q.options[choice] : 'No answer'
    return `${q.topic}: ${choice ? `${choice}) ` : ''}${text}`
  }).join('\n')
}

function buildPrompt(answersText) {
  return `You are generating a comprehensive political alignment deep dive report. The respondent completed a 10-question values diagnostic. This report should be 900–1200 words.

Their answers:
${answersText}

Generate a report with these sections. Use the headers exactly as written.

REPORT STRUCTURE RULES — apply to every section:

1. BRIDGE SENTENCES: End each section with one sentence that points forward to the next section. Format: 'This carries into [next section theme].' or 'This is where [next concept] begins to show up.' Never end a section with a conclusion — end with a transition.

2. SECTION OPENINGS: Never start a section cold. Always open with a callback to the previous logic. Use: 'Building on that...' / 'Given this pattern...' / 'As a result...' / 'This extends into...'

3. NO RESTATEMENT: Do not restate earlier points in later sections. Each section must extend the analysis, not repeat it. If a concept was named in a prior section, reference it briefly and move forward.

4. CONSISTENT TERMINOLOGY: Use the same key terms throughout the entire report. Do not introduce synonyms for the same concept. If you use 'outcomes-focused' in section one, use 'outcomes-focused' throughout — not 'results-oriented' or 'pragmatic' as substitutes.

5. ONE FUNCTION PER SECTION: Each section does exactly one job:
- Core Orientation: Define the pattern
- How You Evaluate Systems: Extend the pattern into decisions
- Where Tension Shows Up: Name the internal friction
- Where This Works: Application and leverage
- Where It Breaks Down: Constraint and limit
- System Context: External placement
- Final Orientation: Synthesize — do not introduce new ideas

6. FINAL SECTION RULE: The Final Orientation section must synthesize all prior sections into one coherent orientation. Do not introduce any new concepts, examples, or observations. Only synthesize what has already been established.

One-line system rule: Each section should feel like the next step in the same line of reasoning, not a new topic.

Core Orientation
A narrative portrait of this person's political orientation. Not a list — prose. Name the specific ideological home, explain what drives it, and describe how it sits in the current political landscape.

Regardless of what profile emerges from the answers, always open this section with an observation the respondent would recognize as accurate and non-threatening before introducing any complexity or tension. Even profiles that lean toward disruption or anti-institutionalism should feel seen and understood in the first paragraph before the analysis deepens.

Historical Context
Three figures from history whose political orientation resembles this person's pattern. For each: name, era, one sentence on the resemblance, one sentence on where they diverged or were tested.

System Context
Which factions within current American political parties would welcome this person, which would tolerate them, and which would reject them — and why. Be specific about intra-party dynamics, not just party labels.

Where You Sit
A score from 1–10 (1 = fully at home in existing parties, 10 = no real home in current politics). Explain the score. What would need to change in the political landscape for this person to feel more represented?

Where This Works
Three specific areas where this person's orientation gives them unusual effectiveness or credibility — places where their values and instincts align with real civic need. Be concrete.

Where It Breaks Down
Two or three patterns in how this person processes political information or makes decisions that could work against them — not character flaws, but cognitive or emotional tendencies revealed by their answers. Frame these as useful self-knowledge, not criticism.

Final Orientation (final section, no additional header label needed)

End the report with exactly 3-4 sentences following this structure:

Line 1 — Pattern: "You approach civic and political questions by [what they do / how they think]." Use their actual answer patterns, not generic language.

Line 2 — Tradeoff: "That gives you [what it provides], but it also [what it costs or limits]." Name the real tradeoff honestly without judgment.

Line 3 — Tension: "The tension isn't about being right or wrong — it's about [where this creates friction or complexity]."

Line 4 — Forward lens: "The key question going forward is [what to watch for or notice] — and where [this approach] may need to adapt."

Rules for this section:
- No advice, no instructions, no "you should"
- No judgment, no "this limits your effectiveness"
- No summary conclusion, no "in conclusion you are"
- Do not add a header — let it close naturally after the last section
- The reader should finish feeling: "that showed me how I think" not "that told me what to think"
- Maximum 4 sentences. Do not exceed this.

Use Title Case for all section headers, not ALL CAPS. Headers should feel like steps in a diagnostic system, not essay headings. Each header should answer the question: what is this section doing for the reader?

Paragraph length: keep each paragraph to 2–4 sentences maximum. After every 2–3 paragraphs, insert a blank line to create visual breathing room. Use bold (**text**) sparingly — no more than 1–2 instances per section, only for genuinely load-bearing phrases.

Write in second person ("You..."). Be direct. Do not hedge. This is what they paid for.`
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function findRecordBySessionId(sessionId, token) {
  const params = new URLSearchParams({
    filterByFormula: `{Session ID}="${sessionId}"`,
    maxRecords: 1,
  })
  params.append('fields[]', 'Report Generated')
  const res = await fetch(`${airtableBase()}/Alignment%20Response?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    console.error('findRecordBySessionId error:', res.status, await res.text())
    return null
  }
  const data = await res.json()
  return data.records?.[0] ?? null
}

async function updateAirtableRecord(recordId, fields, token) {
  console.log('updateAirtableRecord fields:', JSON.stringify(fields))
  const res = await fetch(`${airtableBase()}/Alignment%20Response/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const body = await res.text()
  console.log('updateAirtableRecord status:', res.status)
  if (!res.ok) {
    console.error('updateAirtableRecord error body:', body)
    const err = new Error(`Airtable PATCH ${res.status}`)
    err.status = res.status
    throw err
  }
}

function markdownToHtml(text) {
  const s = 'font-family:sans-serif;'
  const lines = text.split('\n')
  const out = []
  let paraLines = []
  let listItems = []

  function flushPara() {
    if (!paraLines.length) return
    const content = paraLines.join(' ').trim()
    if (content) out.push(`<p style="${s}font-size:16px;line-height:1.7;color:#333;margin:0 0 18px;">${content}</p>`)
    paraLines = []
  }

  function flushList() {
    if (!listItems.length) return
    out.push(`<ul style="margin:0 0 20px;padding-left:20px;">${listItems.join('')}</ul>`)
    listItems = []
  }

  function inline(str) {
    return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const li = line.match(/^[*-]\s+(.+)/)

    if (h1) {
      flushList(); flushPara()
      out.push(`<h1 style="${s}font-size:28px;margin:32px 0 8px;color:#111;">${inline(h1[1])}</h1>`)
    } else if (h2) {
      flushList(); flushPara()
      out.push(`<h2 style="${s}font-size:20px;font-weight:500;margin:36px 0 8px;color:#111;">${inline(h2[1])}</h2>`)
    } else if (li) {
      flushPara()
      listItems.push(`<li style="${s}font-size:16px;line-height:1.7;color:#333;margin-bottom:8px;">${inline(li[1])}</li>`)
    } else if (line.trim() === '') {
      flushList(); flushPara()
    } else {
      flushList()
      paraLines.push(inline(line))
    }
  }
  flushList(); flushPara()
  return out.join('\n')
}

function buildEmailHtml(reportText) {
  return `<!DOCTYPE html><html><body style="max-width:600px;margin:40px auto;padding:0 24px;background:#fff;">
    <h1 style="font-family:sans-serif;font-size:28px;margin-bottom:4px;color:#111;">Your Political Alignment Deep Dive</h1>
    <p style="font-family:sans-serif;font-size:14px;color:#666;margin-top:0;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:20px;">From Civic Congruence</p>
    <p style="font-family:sans-serif;font-size:15px;color:#555;margin:20px 0 32px;">Your full report is below.</p>
    ${markdownToHtml(reportText)}
    <hr style="margin:48px 0;border:none;border-top:1px solid #eee;">
    <p style="font-family:sans-serif;font-size:13px;color:#999;">Civic Congruence · civiccongruence.org</p>
  </body></html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const airtableToken = process.env.VITE_AIRTABLE_TOKEN

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true })
  }

  const session = event.data.object
  const { email, sessionId, alignmentData: alignmentDataRaw } = session.metadata ?? {}

  if (!sessionId) {
    console.error('No sessionId in metadata')
    return res.status(200).json({ received: true })
  }

  // Idempotency check — look up by internal Session ID (written before checkout, always present)
  const existingRecord = await findRecordBySessionId(sessionId, airtableToken)
  if (!existingRecord) {
    console.warn('No Airtable record found for sessionId:', sessionId)
    return res.status(200).json({ received: true })
  }
  if (existingRecord.fields['Report Generated'] === true) {
    console.log('Report already generated for sessionId:', sessionId, '— skipping duplicate webhook')
    return res.status(200).json({ received: true })
  }
  const recordId = existingRecord.id

  // Optimistic lock — claim the record before generating, so concurrent webhook
  // duplicates that passed the idempotency check above will fail their own claim.
  try {
    await updateAirtableRecord(recordId, { 'Report Generated': true }, airtableToken)
    console.log('Optimistic lock claimed for sessionId:', sessionId)
  } catch (err) {
    console.warn('Failed to claim optimistic lock — likely a duplicate webhook. Skipping.', err.message)
    return res.status(200).json({ received: true })
  }

  let alignmentData = {}
  try {
    alignmentData = JSON.parse(alignmentDataRaw ?? '{}')
  } catch {
    console.error('Failed to parse alignmentData from metadata')
  }

  const answersText = formatAnswers(alignmentData)
  const prompt = buildPrompt(answersText)

  let reportText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })
    reportText = message.content[0].text
  } catch (err) {
    console.error('Anthropic error:', err)
    return res.status(500).json({ error: 'Report generation failed' })
  }

  try {
    await updateAirtableRecord(recordId, {
      'Report': reportText,
      'Stripe Session': session.id,
      'Report Email': email ?? '',
      'Session ID': sessionId,
    }, airtableToken)
    console.log('Airtable record updated successfully:', recordId)
  } catch (err) {
    console.error('Airtable update error status:', err.status ?? 'unknown')
    console.error('Airtable update error message:', err.message)
  }

  if (email) {
    await resend.emails.send({
      from: 'Civic Congruence <contact@civiccongruence.org>',
      to: email,
      subject: 'Your Political Alignment Deep Dive',
      html: buildEmailHtml(reportText),
    }).catch((err) => console.error('Resend error:', err))
  }

  return res.status(200).json({ received: true })
}

export const config = { api: { bodyParser: false } }
