import { useState } from 'react'
import { submitSubscriber } from '../services/airtable'

export default function About({ onNavigate }) {
  const sections = [
    {
      label: 'What This Is',
      headline: 'A signal system.',
      body: 'Civic Congruence is a signal system. It uses structured individual input \u2014 how people prioritize, where they see tension, what they experience day to day \u2014 to surface patterns that are otherwise hard to see.',
    },
    {
      label: 'Why It Exists',
      headline: 'The gap is real.',
      body: 'Most decisions that affect communities are made without clear, current signal about what people are actually experiencing. Surveys are slow. Meetings are unrepresentative. Perceived divisions are often misread. Civic Congruence is designed to reduce that gap.',
    },
    {
      label: 'What Your Input Does',
      headline: 'Individual input becomes shared signal.',
      body: 'Your responses don\u2019t just describe your own views. They contribute to a pattern. Aggregated across many responses, those patterns reveal where alignment is stronger than assumed, where real divides exist, and what institutions are missing. That\u2019s the core mechanism. Individual input becomes shared signal.',
    },
    {
      label: 'Where It Goes',
      headline: 'Signal that can be used.',
      body: 'That signal becomes visible \u2014 to communities, to civic organizations, and to anyone trying to understand what\u2019s actually happening on the ground.',
    },
  ]

  const [subEmail, setSubEmail] = useState('')
  const [subState, setSubState] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!subEmail) return
    setSubState('loading')
    try {
      await submitSubscriber({ Email: subEmail })
      setSubState('done')
    } catch {
      setSubState('error')
    }
  }

  function goToContact() {
    window.scrollTo(0, 0)
    onNavigate('contact')
  }

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <div className="section-label">ABOUT</div>
          <h1>Why this exists.</h1>
          <p className="about-hero-lead">
            Congruence happens when what communities need matches what institutions provide. We make that visible.
          </p>
          <p className="about-hero-sub">
            Civic Congruence shows what&rsquo;s actually happening on the ground, as it happens. Not a media outlet. Not a think tank. A feedback system.
          </p>
          <p className="about-hero-sub">
            Currently being piloted with early community inputs and network partners.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="about-sections">
          {sections.map((s) => (
            <div className="about-section" key={s.label}>
              <div className="about-section-label">{s.label}</div>
              <div className="about-section-body">
                <h2>{s.headline}</h2>
                {s.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
          ))}

          <div className="about-section">
            <div className="about-section-label">Why</div>
            <div className="about-section-body">
              <h2>Why.</h2>
              <p>
                Civic Congruence was created by a civic media and community engagement leader with experience across local government, public media, and community networks. This project exists because the gap between what institutions think communities need and what communities are actually experiencing has become too wide to ignore.
              </p>
            </div>
          </div>

          <div className="about-section">
            <div className="about-section-label">Get Involved</div>
            <div className="about-section-body">
              <h2>Get involved.</h2>
              <p>If you represent a community organization, join the network. For media, policy, or civic infrastructure inquiries, reach out directly.</p>
              <div className="about-contact-actions">
                <button className="btn btn-primary" onClick={goToContact}>
                  Contact us
                </button>
              </div>

              <div className="about-subscribe">
                <div className="about-subscribe-heading">Weekly Signal Brief</div>
                <p className="about-subscribe-sub">Weekly summary of civic patterns across the network. No opinion. Just pattern.</p>
                {subState === 'done' ? (
                  <p className="about-subscribe-confirm">You&rsquo;re on the list.</p>
                ) : (
                  <form className="about-subscribe-form" onSubmit={handleSubscribe}>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="you@email.com"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      required
                    />
                    <button className="btn btn-ghost" type="submit" disabled={subState === 'loading'}>
                      {subState === 'loading' ? 'Subscribing…' : 'Subscribe'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
