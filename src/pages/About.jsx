export default function About({ onNavigate }) {
  const sections = [
    {
      label: 'What This Is',
      headline: 'Civic Congruence is infrastructure, not content.',
      body: 'Most civic data projects produce reports. We build feedback loops. Civic Congruence connects community networks with institutions \u2014 so information about what people are actually experiencing flows both ways, not just top-down. The result is better signal for media, policy, and civic organizations trying to understand what\u2019s happening on the ground.',
    },
    {
      label: 'How It Works',
      headline: 'Three layers, one system.',
      body: 'The Civic Survey maps what people are experiencing in their communities \u2014 housing, health, safety, education, governance. The Political Alignment diagnostic maps how people think about tradeoffs and values. The Network Pulse connects vetted community organizations who submit a weekly signal brief. Together these three layers surface where agreement is stronger than expected, where real divides exist, and what\u2019s being missed by institutions.',
    },
    {
      label: 'Data and Trust',
      headline: 'No editorial layer. No hidden weighting.',
      body: 'Survey responses are reviewed before publication. Network pulse data is synthesized without attribution. The dashboard shows only what has been verified. We don\u2019t decide what matters \u2014 we surface what consistently shows up. If institutions ignore clear signals, that\u2019s visible. Transparency is the accountability mechanism.',
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
          <div className="section-label">About</div>
          <h1>Why this exists.</h1>
          <p className="about-hero-sub">
            Civic Congruence is a civic infrastructure project. Not a media outlet.
            Not a think tank. A feedback system.
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
                <p>{s.body}</p>
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
              <h2>Built by someone who has worked inside the system.</h2>
              <p>
                Civic Congruence was created by community supporters. The project draws
                on years of experience in public media, civic engagement, and
                community-based work. It exists because the gap between what institutions
                think communities need and what communities are actually experiencing has
                become too wide to ignore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
