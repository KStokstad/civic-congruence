export default function About({ onNavigate }) {
  const sections = [
    {
      label: 'What This Is',
      headline: 'Civic Congruence builds infrastructure, not content.',
      body: 'Most civic data efforts produce reports. This project creates feedback loops. It connects community networks with institutions so information about what people are actually experiencing flows both ways, not just top-down. The result is better signal for media, policy, and civic organizations trying to understand what\u2019s happening on the ground.',
    },
    {
      label: 'How It Works',
      headline: 'Three layers, one system.',
      bullets: [
        'The Civic Survey maps what people are experiencing in their communities',
        'The Political Alignment diagnostic maps how people think about tradeoffs',
        'The Network Pulse connects vetted community organizations who submit weekly signal briefs',
      ],
      body: 'Together, these layers reveal where agreement is stronger than expected, where real divides exist, and what institutions may be missing.',
    },
    {
      label: 'Data and Trust',
      headline: 'No editorial framing. No hidden weighting.',
      body: 'Survey responses are reviewed for validity, not interpretation. Network Pulse inputs are synthesized without attribution. The system surfaces patterns that appear consistently across sources. Civic Congruence does not decide what matters. It makes visible what shows up repeatedly. If institutions ignore clear signals, that becomes visible. Transparency is the accountability mechanism.',
    },
  ]

  function goToNetworkPulse() {
    window.scrollTo(0, 0)
    onNavigate('network-pulse')
  }

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <div className="section-label">ABOUT</div>
          <h1>Why this exists.</h1>
          <p className="about-hero-sub">
            Civic Congruence is a civic infrastructure project. Not a media outlet.
            Not a think tank. A feedback system.
          </p>
          <p className="about-hero-sub">
            Designed to be tested in real communities, not theorized.
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
                {s.bullets ? (
                  <>
                    <ul>
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <p>{s.body}</p>
                  </>
                ) : (
                  <p>{s.body}</p>
                )}
              </div>
            </div>
          ))}

          {/* Get involved — appears before Who Is Behind This */}
          <div className="about-section about-section-contact">
            <div className="about-section-label">Get Involved</div>
            <div className="about-section-body">
              <h2>Get involved.</h2>
              <p>
                If you represent a community organization and want to join the pilot
                network, use the application on the Network Pulse page. If you work in
                media, policy, or civic infrastructure and want to learn more, reach out
                directly.
              </p>
              <div className="about-contact-actions">
                <a
                  className="btn btn-ghost"
                  href="mailto:contact@civiccongruence.org"
                >
                  contact@civiccongruence.org
                </a>
                <button className="btn btn-primary" onClick={goToNetworkPulse}>
                  Join the network
                </button>
              </div>
            </div>
          </div>

          {/* Who Is Behind This — last */}
          <div className="about-section">
            <div className="about-section-label">Who Is Behind This</div>
            <div className="about-section-body">
              <h2>Who is behind this.</h2>
              <p>
                Civic Congruence was created by a civic media and community engagement
                leader with experience inside public media, local government, and
                community-based infrastructure. This project exists because the gap between
                what institutions think communities need and what communities are actually
                experiencing has become too wide to ignore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
