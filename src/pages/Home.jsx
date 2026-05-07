import { useState, useEffect } from 'react'

const VERBS = ['informs', 'supports', 'enables']

export default function Home({ onNavigate }) {
  const [verbIndex, setVerbIndex] = useState(0)
  const [verbVisible, setVerbVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVerbVisible(false)
      setTimeout(() => {
        setVerbIndex(i => (i + 1) % VERBS.length)
        setVerbVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Hero — inverted section */}
      <section className="home-hero">
        <div className="home-hero-circle home-hero-circle--large" />
        <div className="home-hero-circle home-hero-circle--medium" />
        <div className="home-hero-circle home-hero-circle--small" />

        <div className="home-hero-inner">
          <div className="home-hero-badge">Civic Infrastructure Project</div>
          <h1 className="home-hero-h1">Better Signal. Not More Noise.</h1>
          <p className="home-hero-subtitle">
            Where community engagement becomes civic policy clarity
          </p>
          <p className="home-hero-body">
            Your community input gets drowned out by noise before it reaches
            decision-makers. They react to what&rsquo;s loudest, or worse,
            don&rsquo;t act at all. Either way, the gap widens. We capture
            what communities are actually experiencing. What&rsquo;s working
            and what isn&rsquo;t. With your help we can close the gap.
          </p>
          <div className="home-hero-actions">
            <button
              className="btn-home-primary"
              onClick={() => onNavigate('civic-survey')}
            >
              Share your experience
            </button>
          </div>
        </div>
      </section>

      {/* Signal section */}
      <section className="home-signal">
        <div className="container">
          <div className="home-signal-header">
            <h2 className="home-signal-h2">
              Signal{' '}
              <span className="home-signal-verb-wrap">
                <span className="home-signal-verb-sizer" aria-hidden="true">supports</span>
                <em
                  className="home-signal-em home-signal-verb"
                  style={{ opacity: verbVisible ? 1 : 0 }}
                >
                  {VERBS[verbIndex]}
                </em>
              </span>
              {' '}better decisions
            </h2>
            <p className="home-signal-sub">
              We turn community input into usable signal. This is how.
            </p>
          </div>
          <div className="home-signal-grid">
            <div className="home-signal-card">
              <div className="home-signal-card-heading">Signal →</div>
              <p className="home-signal-card-bold">
                What communities are actually experiencing.
              </p>
              <p className="home-signal-card-body">
                Direct from communities. Not filtered through institutions.
              </p>
            </div>
            <div className="home-signal-card">
              <div className="home-signal-card-heading">Infrastructure →</div>
              <p className="home-signal-card-bold">
                How input connects to decisions.
              </p>
              <p className="home-signal-card-body">
                Verified, synthesized, and routed to where it can be used.
              </p>
            </div>
            <div className="home-signal-card">
              <div className="home-signal-card-heading">Transparency</div>
              <p className="home-signal-card-bold">
                How patterns become visible.
              </p>
              <p className="home-signal-card-body">
                Institutions see what&rsquo;s consistently showing up, not
                what&rsquo;s being reported to them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Network section */}
      <section className="home-pilot-wrap">
        <div className="home-pilot-card">
          <div className="home-pilot-left">
            <div className="home-pilot-eyebrow">Pilot Network</div>
            <h2 className="home-pilot-h2">
              Join the Civic Congruence Network
            </h2>
            <p className="home-pilot-body">
              Join the network and contribute real-time community input,
              getting it in front of decision-makers.
            </p>
          </div>
          <div className="home-pilot-actions">
            <button
              className="btn-home-primary"
              onClick={() => onNavigate('network-pulse')}
            >
              Join the network
            </button>
            <button
              className="btn-home-surface"
              onClick={() => onNavigate('dashboard')}
            >
              See the data
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
