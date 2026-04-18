export default function Home({ onNavigate }) {
  const features = [
    {
      title: 'Signal →',
      descriptor: 'What people are actually experiencing in their communities.',
      role: 'This is the raw input the system captures.',
    },
    {
      title: 'Infrastructure →',
      descriptor: 'How that information connects to decisions.',
      role: 'This is what turns individual input into something usable.',
    },
    {
      title: 'Transparency →',
      descriptor: 'How patterns become visible and verifiable.',
      role: 'This is what makes the signal usable to institutions.',
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
            <h2>How the system works</h2>
            <p>
              Congruence happens when what communities need matches what institutions
              provide. We make that gap visible.
            </p>
          </div>
          <p className="features-connector">Raw community experience becomes usable signal when it moves through this system.</p>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <h3>{f.title}</h3>
                <p className="feature-descriptor">{f.descriptor}</p>
                <p className="feature-role">{f.role}</p>
              </div>
            ))}
          </div>
          <p className="features-closing">This is how institutions see what's actually happening.</p>
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
