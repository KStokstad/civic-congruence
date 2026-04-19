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
            Noise drowns out important community input before it reaches decision-makers.
            They react to what&rsquo;s loudest, or worse, don&rsquo;t act at all.
            Either way, the gap widens. We capture what people are actually experiencing.
            What&rsquo;s working and what isn&rsquo;t. We help close the gap.
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

      {/* Signal section */}
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

      {/* Call to action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-block">
            <p className="cta-text">
              Congruence happens when what communities need matches what institutions provide.
              We make that gap visible and we need your help.
            </p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate('civic-survey')}>
                Contribute your experience
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('network-pulse')}>
                Join the network
              </button>
            </div>
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
