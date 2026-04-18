export default function Home({ onNavigate }) {
  const features = [
    {
      icon: '📡',
      title: 'Signal',
      anchor: 'What people are actually experiencing',
      body: 'We collect structured civic signal — what people are experiencing, where gaps exist, and what communities are asking for. Not noise, but pattern.',
    },
    {
      icon: '🔗',
      title: 'Infrastructure',
      anchor: 'How that information connects to decisions',
      body: 'We build the connective tissue between lived experience and institutional decision-making, bridging the gap between residents and policy.',
    },
    {
      icon: '🔎',
      title: 'Transparency',
      anchor: 'How it becomes visible and usable',
      body: 'We surface verified data to policymakers, advocates, and the public in ways that are accessible, interpretable, and actionable.',
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
            We capture what people are actually experiencing: what's working and what isn't, and make it visible to the people making decisions.
          </p>
          <p className="hero-signal-line">
            Right now, institutions react to noise. This system captures signal.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('civic-survey')}>
              Contribute your experience
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('dashboard')}>
              See the signal
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <div className="section-label">What We Do</div>
            <h2>How the system works</h2>
            <p>
              Congruence happens when what communities need matches what institutions
              provide. We make that gap visible.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="feature-anchor">{f.anchor}</p>
                <p>{f.body}</p>
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
                Join the network and contribute real-time community signal — getting it in front of decision-makers.
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
