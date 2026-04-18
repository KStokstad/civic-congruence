export default function Home({ onNavigate }) {
  const features = [
    {
      icon: '📡',
      title: 'Signal',
      body: 'We collect structured civic signal — what people are experiencing, where gaps exist, and what communities are asking for. Not noise, but pattern.',
    },
    {
      icon: '🔗',
      title: 'Infrastructure',
      body: 'We build the connective tissue between lived experience and institutional decision-making, bridging the gap between residents and policy.',
    },
    {
      icon: '🔎',
      title: 'Transparency',
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
          <p className="hero-subtitle">Where civic signal becomes policy clarity.</p>
          <p className="hero-sub">
            Civic Congruence connects institutions with how communities actually build trust,
            share information, and make decisions.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('civic-survey')}>
              Take the Survey
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('dashboard')}>
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <div className="section-label">What We Do</div>
            <h2>Three pillars of civic alignment</h2>
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
                We're recruiting civic leaders, community organizers, and engaged residents to
                participate in our pilot network. Weekly pulse check-ins help us build a
                real-time picture of community needs — and get that signal to the people who
                can act on it.
              </p>
            </div>
            <div className="pilot-actions">
              <button
                className="btn btn-pilot-primary btn-lg"
                onClick={() => onNavigate('network-pulse')}
              >
                Apply to Join
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
