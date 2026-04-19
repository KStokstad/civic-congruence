import { useState, useEffect } from 'react'

const CYCLE_WORDS = ['informs', 'creates', 'enables']

export default function Home({ onNavigate }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % CYCLE_WORDS.length)
        setVisible(true)
      }, 400)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      title: 'Signal →',
      descriptor: 'What people are actually experiencing in their communities.',
      body: 'This is the input. It comes directly from community members, not filtered through institutions.',
    },
    {
      title: 'Infrastructure →',
      descriptor: 'How individual input becomes usable data.',
      body: 'Responses are verified, synthesized, and connected to decision-making systems.',
    },
    {
      title: 'Transparency →',
      descriptor: 'How patterns become visible to the people who need to act on them.',
      body: "Institutions see what's consistently showing up — not what's being reported to them.",
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            Civic Infrastructure Project
          </div>
          <h1 className="hero-headline">Better signal. Not more noise.</h1>
          <p className="hero-subtitle">Turn real community experience into usable policy signal.</p>
          <p className="hero-sub">
            We capture what people are actually experiencing. What's working and what isn't. We make it visible to decision-makers.
          </p>
          <p className="hero-signal-line">
            Right now, institutions react to noise. This system captures signal.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('civic-survey')}>
              Contribute your experience
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('dashboard')}>
              View the signal
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <div className="section-label">What We Do</div>
            <h2>
              Signal{' '}
              <span
                style={{
                  color: 'var(--accent)',
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  display: 'inline-block',
                }}
              >
                {CYCLE_WORDS[wordIndex]}
              </span>
              {' '}better decisions
            </h2>
            <p>
              Congruence happens when what communities need matches what institutions
              provide. We make that gap visible.
            </p>
          </div>
          <p className="features-connector">Most community input gets lost before it reaches the people making decisions. This system makes sure it doesn&rsquo;t.</p>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <h3>{f.title}</h3>
                <p className="feature-descriptor">{f.descriptor}</p>
                <p className="feature-body">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="features-closing">This is how community experience becomes policy signal.</p>
        </div>
      </section>

      {/* Pilot Card */}
      <section className="pilot-section">
        <div className="container">
          <div className="pilot-card">
            <div>
              <div className="pilot-label">Pilot Network</div>
              <h2>Join the Civic Congruence Network</h2>
              <p>
                Join the network and contribute real-time community signal, getting it in front of decision-makers.
              </p>
            </div>
            <div className="pilot-actions">
              <button
                className="btn btn-pilot-primary btn-lg"
                onClick={() => onNavigate('network-pulse')}
              >
                Join the network
              </button>
              <button
                className="btn btn-pilot-secondary btn-lg"
                onClick={() => onNavigate('dashboard')}
              >
                See the Data
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
