import { useState, useEffect } from 'react'

const HEADINGS = [
  'Signal informs better decisions',
  'Better decisions start with better signal',
]

export default function Home({ onNavigate }) {
  const [headingIndex, setHeadingIndex] = useState(0)
  const [headingVisible, setHeadingVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeadingVisible(false)
      setTimeout(() => {
        setHeadingIndex(1)
        setHeadingVisible(true)
      }, 400)
    }, 3000)
    return () => clearTimeout(timer)
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
            <h2 style={{ opacity: headingVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              {HEADINGS[headingIndex]}
            </h2>
            <p>
              Congruence happens when what communities need matches what institutions
              provide. We make that gap visible.
            </p>
            <p>
              Most community input gets lost before it reaches the people making decisions. This system makes sure it doesn&rsquo;t.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <h3>{f.title}</h3>
                <p className="feature-descriptor">{f.descriptor}</p>
                <p className="feature-body">{f.body}</p>
              </div>
            ))}
          </div>
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
