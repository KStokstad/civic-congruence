import { useState, useEffect } from 'react'

const VERBS = ['informs', 'supports', 'enables']

export default function Home({ onNavigate }) {
  const [verbIndex, setVerbIndex] = useState(0)
  const [verbVisible, setVerbVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVerbVisible(false)
      setTimeout(() => {
        setVerbIndex((i) => (i + 1) % VERBS.length)
        setVerbVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      title: 'Signal →',
      descriptor: 'What communities are actually experiencing.',
      body: 'Direct from communities. Not filtered through institutions.',
    },
    {
      title: 'Infrastructure →',
      descriptor: 'How input connects to decisions.',
      body: 'Verified, synthesized, and routed to where it can be used.',
    },
    {
      title: 'Transparency →',
      descriptor: 'How patterns become visible.',
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
          <h1 className="hero-headline">Better Signal. Not More Noise.</h1>
          <p className="hero-subtitle">Where community engagement becomes civic policy</p>
          <p className="hero-sub">
            Your community input gets drowned out by noise before it reaches decision-makers. They react to what&rsquo;s loudest, or worse, don&rsquo;t act at all. Either way, the gap widens. We capture what communities are actually experiencing. What&rsquo;s working and what isn&rsquo;t. With your help we can close the gap.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('civic-survey')}>
              Share your experience
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('dashboard')}>
              View the signal
            </button>
          </div>
        </div>
      </section>

      {/* Animated headline */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <h2>
              Signal{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ visibility: 'hidden', userSelect: 'none' }} aria-hidden="true">supports</span>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  color: 'var(--accent)',
                  opacity: verbVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  whiteSpace: 'nowrap',
                }}>
                  {VERBS[verbIndex]}
                </span>
              </span>
              {' '}better decisions
            </h2>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="cards-section">
        <div className="container">
          <p className="cards-connector">We turn community input into usable signal. This is how.</p>
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

      {/* Pilot network */}
      <section className="pilot-section">
        <div className="container">
          <div className="pilot-card">
            <div>
              <div className="pilot-label">Pilot Network</div>
              <h2>Join the Civic Congruence Network</h2>
              <p>
                Join the network and contribute real-time community input, getting it in front of decision-makers.
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
