import { useState, useEffect, useRef } from 'react'
import { submitSurvey, fetchSurveyCount } from '../services/airtable'

const ALL_TOPICS = [
  {
    id: 'economy',
    label: 'Economy',
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
    notesField: 'Economy Notes',
    concernField: 'Economy Concern',
    missingField: 'Economy Missing',
    concerns: [
      'Housing costs',
      'Wages and income stability',
      'Job availability',
      'Cost of everyday goods',
      'Small business and local economy',
    ],
  },
  {
    id: 'safety',
    label: 'Safety',
    scale: {
      text: `Based on what you've seen locally, when tradeoffs have to be made — where do you lean?`,
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
    notesField: 'Safety Notes',
    concernField: 'Safety Concern',
    missingField: 'Safety Missing',
    concerns: [
      'Police response and accountability',
      'Neighborhood crime',
      'Drug and addiction issues',
      'Domestic violence and family safety',
      'Traffic and pedestrian safety',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    scale: {
      text: `Thinking about your community's health system, when tradeoffs have to be made — where do you lean?`,
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
    notesField: 'Health Notes',
    concernField: 'Health Concern',
    missingField: 'Health Missing',
    concerns: [
      'Cost of care',
      'Access to providers',
      'Mental health services',
      'Insurance coverage',
      'Emergency and urgent care',
    ],
  },
  {
    id: 'education',
    label: 'Education',
    scale: {
      text: `Based on what you see in your community's schools, when tradeoffs have to be made — where do you lean?`,
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
    notesField: 'Education Notes',
    concernField: 'Education Concern',
    missingField: 'Education Missing',
    concerns: [
      'School funding',
      'Teacher quality and retention',
      'Curriculum and standards',
      'Special needs and support services',
      'School safety',
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
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
    notesField: 'Governance Notes',
    concernField: 'Governance Concern',
    missingField: 'Governance Missing',
    concerns: [
      'Greater transparency',
      'More public input on decisions',
      'Faster response to community concerns',
      'Independent oversight',
      'Better communication from officials',
    ],
  },
]

const TOPIC_SETS = [
  ['economy', 'safety', 'health'],
  ['safety', 'health', 'education'],
  ['health', 'education', 'governance'],
  ['education', 'governance', 'economy'],
  ['governance', 'economy', 'safety'],
]

const TOPICS_BY_ID = Object.fromEntries(ALL_TOPICS.map((t) => [t.id, t]))
const CLOSING_FIELD = 'Biggest Impact'

function getScoreColor(score) {
  if (score <= 1) return 'score-low'
  return 'score-high'
}

function buildSnapshot(topics, answers) {
  const scores = topics.map((t) => ({ label: t.label, score: answers[t.scale.fieldName] || 0 }))
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const highest = sorted[sorted.length - 1]
  const lowest = sorted[0]
  const pattern = `${highest.label} feels stronger than trust in ${lowest.label.toLowerCase()}`
  return { highest, lowest, pattern }
}

function buildShareSummary(highest, lowest) {
  const highMap = {
    Economy: 'Economic confidence',
    Safety: 'Safety confidence',
    Health: 'Health confidence',
    Education: 'Education confidence',
    Governance: 'Governance confidence',
  }
  const lowMap = {
    Economy: 'Economic gap',
    Safety: 'Safety gap',
    Health: 'Health access gap',
    Education: 'Education gap',
    Governance: 'Public trust gap',
  }
  const hi = highMap[highest.label] || `${highest.label} confidence`
  const lo = lowMap[lowest.label] || `${lowest.label} gap`
  return `${hi}. ${lo}.`
}

export default function CivicSurvey({ onNavigate }) {
  const [surveyPhase, setSurveyPhase] = useState('loading')
  const [topicQueue, setTopicQueue] = useState([])
  const [extensionTopics, setExtensionTopics] = useState([])
  const [topicIdx, setTopicIdx] = useState(0)
  const [topicPhase, setTopicPhase] = useState(0)
  const [extensionOffered, setExtensionOffered] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [reflection, setReflection] = useState(null)
  const [reflectionLoading, setReflectionLoading] = useState(false)
  const [csPatternLabel, setCsPatternLabel] = useState(null)
  const [csPatternSupport, setCsPatternSupport] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const csShareCardRef = useRef(null)

  function initSurvey(count) {
    const setIdx = (count || 0) % 5
    const requiredIds = TOPIC_SETS[setIdx]
    const required = requiredIds.map((id) => TOPICS_BY_ID[id])
    const extension = ALL_TOPICS.filter((t) => !requiredIds.includes(t.id))
    setTopicQueue(required)
    setExtensionTopics(extension)
    setSurveyPhase('topics')
  }

  useEffect(() => {
    fetchSurveyCount()
      .then(initSurvey)
      .catch(() => initSurvey(0))
  }, [])

  useEffect(() => {
    if (surveyPhase !== 'results') return
    const key = import.meta.env.VITE_ANTHROPIC_KEY
    if (!key) return

    setReflectionLoading(true)
    const topicLines = topicQueue.map((t) => {
      const score = answers[t.scale.fieldName] ?? 'not answered'
      const concern = answers[t.concernField] ?? 'none provided'
      const missing = answers[t.missingField]?.trim() || 'none provided'
      const notes = answers[t.notesField]?.trim() || 'none provided'
      return `${t.label}: ${score}/5. Main concern: ${concern}. What's missing: ${missing}. Notes: ${notes}`
    }).join('\n')

    const prompt = `A community member just completed a civic experience survey. Based on their responses, generate three outputs using the exact labels below.

Their responses:
${topicLines}

PATTERN_LABEL: Write a plain civic identity pattern in 8 words or fewer. Do not compare scores to each other directly. Translate the score pattern into a human civic identity — something the person would recognize in themselves. Format: "[Sees/Feels] [positive], but [gap]." No numbers. No area names unless essential. Use this lookup as a guide: Economy high + Education/Governance low → "Sees opportunity, but not accountability." Health high + Economy low → "Holding health together while costs strain." Safety low + Governance low → "Feels exposed and unheard." Education low + Economy low → "Worried the basics are slipping." Governance low + mixed → "Wants answers, not vague promises." All low → "Sees the gaps. Not asking for much."

PATTERN_SUPPORT: One plain conversational sentence, maximum 20 words, expanding on the pattern label. Example: "You see signs of local economic strength, but education and governance feel harder to trust."

REFLECTION:
Write a brief, grounded reflection that makes them feel accurately heard. Reference their specific written comments directly if they provided any. Connect their scale scores to their lived experience. Do not be analytical or use policy language. Sound human, specific, and observational — like someone who read what they wrote and understood it.
- If they provided written notes, reference the specific content directly
- If no notes were provided, work from scale scores, selected concerns, and what's missing text
- Do not use the words 'survey', 'data', 'responses', or 'analysis'
- Do not start with 'Your responses suggest' or 'Based on your responses'. Begin directly with the observation.
- Sound like a thoughtful person reading what they wrote, not an AI summarizing data
- Use observational language: "It sounds like" not "You are", "This may reflect" not "This reflects"
- Write in 2-3 short paragraphs separated by a blank line. Do not write one continuous block of text
- Never state something as certain fact — always frame as observation from their input
- Use reflective language: 'It sounds like...' or 'You're pointing to...' not 'This suggests...'`

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data?.content?.[0]?.text
        if (!text) return
        const labelMatch = text.match(/^PATTERN_LABEL:\s*(.+)/m)
        const supportMatch = text.match(/^PATTERN_SUPPORT:\s*(.+)/m)
        const reflectionMatch = text.match(/^REFLECTION:\s*([\s\S]+)$/m)
        if (labelMatch) setCsPatternLabel(labelMatch[1].trim())
        if (supportMatch) setCsPatternSupport(supportMatch[1].trim())
        const reflectionText = reflectionMatch ? reflectionMatch[1].trim() : text.trim()
        setReflection(reflectionText)
      })
      .catch(() => {})
      .finally(() => setReflectionLoading(false))
  }, [surveyPhase])

  function answer(fieldName, value) {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }))
  }

  async function handleShareImage() {
    if (!csShareCardRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const w = csShareCardRef.current.offsetWidth
    const canvas = await html2canvas(csShareCardRef.current, { scale: 2, width: w, height: w, backgroundColor: null, useCORS: true })
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (isMobile && navigator.canShare) {
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

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  function reset() {
    setTopicIdx(0)
    setTopicPhase(0)
    setExtensionOffered(false)
    setAnswers({})
    setSubmitting(false)
    setSubmitted(false)
    setError(null)
    setReflection(null)
    setReflectionLoading(false)
    setCsPatternLabel(null)
    setCsPatternSupport(null)
    setTopicQueue([])
    setExtensionTopics([])
    setSurveyPhase('loading')
    fetchSurveyCount()
      .then(initSurvey)
      .catch(() => initSurvey(0))
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

  function goNext() {
    if (topicPhase === 0) {
      setTopicPhase(1)
    } else {
      const nextIdx = topicIdx + 1
      if (nextIdx < topicQueue.length) {
        setTopicIdx(nextIdx)
        setTopicPhase(0)
      } else if (!extensionOffered) {
        setExtensionOffered(true)
        setSurveyPhase('extension-prompt')
      } else {
        setSurveyPhase('closing')
      }
    }
  }

  function goBack() {
    if (topicPhase === 1) {
      setTopicPhase(0)
    } else if (topicIdx > 0) {
      setTopicIdx(topicIdx - 1)
      setTopicPhase(1)
    }
  }

  function acceptExtension() {
    setTopicQueue((prev) => [...prev, ...extensionTopics])
    setTopicIdx(3)
    setTopicPhase(0)
    setSurveyPhase('topics')
  }

  function skipExtension() {
    setSurveyPhase('closing')
  }

  // ── Loading ──────────────────────────────────────
  if (surveyPhase === 'loading') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 60 }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  // ── Submitted ────────────────────────────────────
  if (submitted && surveyPhase !== 'results') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="submit-success">
            <div className="success-icon">✓</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
              Thank you. Your anonymous responses have been added to the Civic Congruence dataset.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('political-alignment')}>
                Understand your political values →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────
  if (surveyPhase === 'results') {
    const { highest, lowest, pattern } = buildSnapshot(topicQueue, answers)
    const shareSummary = buildShareSummary(highest, lowest)

    // TODO: replace with real dashboard data — % of respondents sharing same lowest-scoring area
    const communityResonancePct = null
    const resonanceBadgeText = communityResonancePct != null
      ? `${communityResonancePct}% of respondents share this signal`
      : 'A civic signal from your community'

    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="results-screen">
            <div className="section-label" style={{ textAlign: 'center', marginBottom: 8, fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold-text)' }}>YOUR RESULT</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--text-h)', marginBottom: 0, fontWeight: 400 }}>
              {csPatternLabel || 'Your Civic Alignment'}
            </h2>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0 8px' }}>
              {topicQueue.map((t) => {
                const pillScore = answers[t.scale.fieldName]
                const isHighest = t.label === highest.label
                const isLowest = t.label === lowest.label
                return (
                  <div
                    key={t.id}
                    style={{
                      background: 'var(--surface-2)',
                      border: `1px solid ${isHighest ? 'var(--gold)' : 'var(--border-soft)'}`,
                      borderRadius: 20,
                      padding: '8px 16px',
                      fontSize: 13,
                      color: 'var(--text)',
                    }}
                  >
                    {t.label} {pillScore}/5{isLowest ? ' · Lowest' : ''}
                  </div>
                )
              })}
            </div>

            <div style={{ margin: '8px 0 16px' }}>
              <span className="cs-resonance-badge">{resonanceBadgeText}</span>
            </div>

            {csPatternSupport && (
              <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, margin: '0 0 24px' }}>
                {csPatternSupport}
              </p>
            )}

            <hr className="cs-result-divider" />

            {reflectionLoading && (
              <div style={{ marginBottom: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                  Reflecting on your responses…
                </p>
              </div>
            )}

            {reflection && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
                  <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.7, margin: 0, fontWeight: 400, whiteSpace: 'pre-wrap' }}>
                    {reflection}
                  </p>
                </div>
              </div>
            )}

            <div className="results-grid">
              {topicQueue.map((t) => {
                const score = answers[t.scale.fieldName]
                const pct = score ? (score / 5) * 100 : 0
                const isHighest = t.label === highest.label
                const isLowest = t.label === lowest.label
                return (
                  <div className="result-row" key={t.id}>
                    <div className="result-row-top">
                      <div className="result-topic-name">
                        {t.label}
                        {isHighest && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-light)', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>Highest</span>}
                        {isLowest && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>Lowest</span>}
                      </div>
                      <span className="result-score-badge">{score} / 5</span>
                    </div>
                    <div className="result-bar-track">
                      <div className={`result-bar-fill ${getScoreColor(score)}`} style={{ width: `${pct}%` }} />
                    </div>
                    {answers[t.concernField] && (
                      <div className="result-choice-text">{answers[t.concernField]}</div>
                    )}
                  </div>
                )
              })}
            </div>

            <hr className="cs-result-divider" style={{ margin: '32px 0' }} />

            <div style={{ background: 'var(--inverted-bg)', borderRadius: 16, padding: '28px 32px', marginTop: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', border: '1.5px solid rgba(200,169,110,0.12)' }} />
              <div style={{ position: 'absolute', bottom: -40, left: 10, width: 120, height: 120, borderRadius: '50%', border: '1.5px solid rgba(200,169,110,0.08)' }} />
              <div style={{ position: 'relative' }}>
                {submitted ? (
                  <>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 8 }}>
                      SUBMISSION COMPLETE
                    </p>
                    <p style={{ fontSize: 14, color: 'rgba(184,168,136,0.9)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                      Thank you. Your anonymous responses have been added to the Civic Congruence dataset.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 10 }}>
                      CONTRIBUTE YOUR SIGNAL
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--inverted-text)', marginBottom: 10, fontWeight: 400 }}>
                      Your experience becomes part of the community dataset.
                    </h3>
                    <p style={{ fontSize: 14, color: 'rgba(184,168,136,0.8)', lineHeight: 1.6, marginBottom: 6 }}>
                      Your result is ready. Your responses have not yet been added to the community dataset.
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(160,144,112,0.6)', marginBottom: 24 }}>
                      Responses remain anonymous.
                    </p>
                    {error && <div className="error-banner">{error}</div>}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        background: 'var(--gold)', color: '#1a1814', border: 'none',
                        borderRadius: 9, padding: 13, width: '100%',
                        fontSize: 15, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#a8843e'; e.currentTarget.style.color = '#ffffff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#1a1814' }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = '' }}
                    >
                      {submitting ? 'Saving…' : 'Submit my responses to the dataset'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {submitted && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'center' }}>
                  OPTIONAL: SHARE YOUR RESULT
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' }}>
                  This shares your civic signal publicly. It does not submit additional data.
                </p>
                <div className="cs-result-share-card" ref={csShareCardRef}>
                  <div className="cs-result-share-circle cs-result-share-circle--1" />
                  <div className="cs-result-share-circle cs-result-share-circle--2" />
                  <div className="cs-result-share-inner">
                    <div className="cs-result-share-top">
                      <p className="cs-result-share-eyebrow">
                        My Civic Signal
                      </p>
                      <p className="cs-result-share-subhead">
                        Civic Congruence · Civic Survey
                      </p>
                    </div>
                    <div className="cs-result-share-middle">
                      <p className="cs-result-share-headline">
                        {csPatternLabel || pattern}
                      </p>
                      <p className="cs-result-share-desc">
                        {shareSummary}
                      </p>
                      <span className="cs-resonance-badge">{resonanceBadgeText}</span>
                    </div>
                    <div className="cs-result-share-bottom">
                      <div className="cs-result-share-cta-pill">
                        Find your civic signal →
                      </div>
                      <p className="cs-result-share-url">
                        civiccongruence.org
                      </p>
                    </div>
                  </div>
                </div>
                <div className="cs-result-share-btns" style={{ width: '100%' }}>
                  <button
                    className="cs-result-share-action cs-result-share-action--dark"
                    onClick={handleShareImage}
                  >
                    Share your signal
                  </button>
                  <button
                    className="cs-result-share-action cs-result-share-action--light"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
                  Every signal shared helps show what people are actually experiencing.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    )
  }

  // ── Extension prompt ─────────────────────────────
  if (surveyPhase === 'extension-prompt') {
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="topic-step">
            <div className="survey-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '60%' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-h)', margin: '0 0 8px' }}>
                You've shared your experience in 3 areas.
              </p>
              <p style={{ fontSize: 15, color: 'var(--text)', margin: '0 0 32px' }}>
                Want to continue with the remaining topics?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
                <button className="btn btn-primary" onClick={acceptExtension}>
                  Yes, continue
                </button>
                <button className="btn btn-ghost" onClick={skipExtension}>
                  Skip ahead to final question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Closing ──────────────────────────────────────
  if (surveyPhase === 'closing') {
    const closingOptions = topicQueue.map((t) => t.label)
    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="topic-step">
            <div className="survey-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="topic-heading">
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
                {closingOptions.map((opt) => (
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
                <button className="btn btn-ghost" onClick={() => {
                  setTopicIdx(topicQueue.length - 1)
                  setTopicPhase(1)
                  setSurveyPhase('topics')
                }}>
                  ← Back
                </button>
              </div>
              <div className="survey-nav-right">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Final</span>
                <button
                  className="btn btn-primary"
                  onClick={() => setSurveyPhase('results')}
                  disabled={answers[CLOSING_FIELD] === undefined}
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

  // ── Topic step ───────────────────────────────────
  const topic = topicQueue[topicIdx]
  if (!topic) return null

  const totalTopics = topicQueue.length
  const progressPct = ((topicIdx * 2 + topicPhase) / (totalTopics * 2)) * 100

  // ── Phase 1: Concern + Missing ────────────────────
  if (topicPhase === 1) {
    const canAdvance = answers[topic.concernField] !== undefined
    const isLastTopic = topicIdx === topicQueue.length - 1

    return (
      <div className="survey-page">
        <div className="container-sm">
          <div className="topic-step" key={`${topic.id}-1`}>
            <div className="survey-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="topic-heading">
              <div>
                <div className="topic-num">Topic {topicIdx + 1} of {totalTopics}</div>
                <h3>{topic.label}</h3>
              </div>
            </div>

            <div className="question-block">
              <div className="question-text">What concerns you most right now?</div>
              <div className="choice-options">
                {topic.concerns.map((opt) => (
                  <button
                    key={opt}
                    className={`choice-btn ${answers[topic.concernField] === opt ? 'selected' : ''}`}
                    onClick={() => answer(topic.concernField, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="topic-notes-block">
              <label className="topic-notes-label" htmlFor={`missing-${topic.id}`}>
                Tell us more about what's behind this (optional)
              </label>
              <textarea
                id={`missing-${topic.id}`}
                className="topic-notes-textarea"
                rows={2}
                value={answers[topic.missingField] || ''}
                onChange={(e) => answer(topic.missingField, e.target.value)}
                placeholder="Optional — what feels missing in your experience?"
              />
            </div>

            <div className="survey-nav">
              <div>
                <button className="btn btn-ghost" onClick={goBack}>← Back</button>
              </div>
              <div className="survey-nav-right">
                <button
                  className={`btn ${canAdvance ? 'btn-primary btn-nav-ready' : 'btn-primary'}`}
                  onClick={goNext}
                  disabled={!canAdvance}
                >
                  {isLastTopic ? 'Final question →' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase 0: Scale + Notes ────────────────────────
  const scaleAnswered = answers[topic.scale.fieldName] !== undefined

  return (
    <>
      {topicIdx === 0 && (
        <>
          <div className="cs-hero">
            <div className="cs-hero-circle cs-hero-circle--1" />
            <div className="cs-hero-circle cs-hero-circle--2" />
            <div className="cs-hero-circle cs-hero-circle--3" />
            <div className="cs-hero-content">
              <p className="cs-eyebrow">CIVIC SURVEY</p>
              <h1 className="cs-hero-h1">What is your community actually experiencing?</h1>
              <p className="cs-hero-sub">Most surveys ask for your opinion. This one asks for your experience. The difference is what makes the data useful.</p>
              <button
                className="cs-hero-cta"
                onClick={() => document.getElementById('cs-survey-anchor')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Share your experience
              </button>
              <p className="cs-hero-note">Free &middot; Anonymous &middot; Takes about 3 minutes</p>
            </div>
          </div>
          <div className="cs-signal">
            <div className="cs-signal-inner">
              <h2 className="cs-signal-h2">Your experience becomes shared <em>signal</em></h2>
              <p className="cs-signal-body">When you answer, Civic Congruence uses your responses to show patterns across governance, economy, safety, health, and education. Your private result is generated first. Nothing is added to the community dataset unless you choose to submit it.</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                Choose what is closest to your experience. Imperfect answers are expected.
              </p>
            </div>
          </div>
        </>
      )}
    <div className="survey-page" id="cs-survey-anchor">
      <div className="container-sm">
        {topicIdx === 0 && (
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 28px' }} />
        )}

        <div className="topic-step" key={`${topic.id}-0`}>
          <div className="survey-progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="topic-heading">
            <div>
              <div className="topic-num">Topic {topicIdx + 1} of {totalTopics}</div>
              <h3>{topic.label}</h3>
            </div>
          </div>

          <div className="question-block">
            <div className="question-text">{topic.scale.text}</div>
            <div className="scale-wrapper">
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '0 0 8px' }}>
                If you&rsquo;re unsure, go with your first instinct.
              </p>
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

          {!scaleAnswered && (
            <p className="followup-hint">Additional questions will appear after you select.</p>
          )}

          {scaleAnswered && (
            <div className="topic-notes-block question-block--fade-in">
              <label className="topic-notes-label" htmlFor={`notes-${topic.id}`}>
                Anything else about {topic.label} in your community? (optional)
              </label>
              <textarea
                id={`notes-${topic.id}`}
                className="topic-notes-textarea"
                rows={2}
                value={answers[topic.notesField] || ''}
                onChange={(e) => answer(topic.notesField, e.target.value)}
                placeholder="Optional — share any additional context here."
              />
            </div>
          )}

          <div className="survey-nav">
            <div>
              {topicIdx > 0 && (
                <button className="btn btn-ghost" onClick={goBack}>← Back</button>
              )}
            </div>
            <div className="survey-nav-right">
              <button
                className={`btn ${scaleAnswered ? 'btn-primary btn-nav-ready' : 'btn-primary'}`}
                onClick={goNext}
                disabled={!scaleAnswered}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
