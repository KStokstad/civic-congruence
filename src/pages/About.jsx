export default function About({ onNavigate }) {
  const sections = [
    {
      label: 'What This Is',
      headline: 'Civic Congruence builds infrastructure, not content.',
      body: 'Most decisions that affect people\u2019s lives are made with incomplete, delayed, or filtered information. Community experience is fragmented across surveys, meetings, and informal networks, while institutions operate on partial signals. Civic Congruence closes that gap by connecting community input, local networks, and institutional decision-making into a continuous feedback loop. The result is better signal, so decisions can reflect what people are actually experiencing. Designed for communities, civic organizations, and institutions trying to make decisions with incomplete or outdated information.',
    },
    {
      label: 'How It Works',
      headline: 'Three layers, one system.',
      bullets: [
        'Civic Survey \u2014 what people are experiencing in their communities',
        'Political Alignment diagnostic \u2014 how people think about tradeoffs',
        'Network Pulse \u2014 vetted organizations submit weekly signal briefs',
      ],
      example: 'A local housing issue might show up in survey responses, flagged by community partners, and surface as a clear signal institutions can act on.',
      body: 'Together, these layers reveal where agreement is stronger than expected, where real divides exist, and what institutions may be missing.',
    },
    {
      label: 'Data and Trust',
      headline: 'No editorial framing built into the system. No hidden weighting of results.',
      body: 'Survey responses are reviewed for validity, not interpretation. Network Pulse inputs are synthesized without attribution. The system surfaces patterns as they consistently appear.\n\nCivic Congruence does not decide what matters. It makes visible what shows up repeatedly.',
    },
  ]

  function goToContact() {
    window.scrollTo(0, 0)
    onNavigate('contact')
  }

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <div className="section-label">ABOUT</div>
          <h1>Why this exists.</h1>
          <p className="about-hero-sub">
            Civic Congruence shows what&rsquo;s actually happening on the ground, in real time. Not a media outlet. Not a think tank. A feedback system.
          </p>
          <p className="about-hero-sub">
            Currently being piloted with early community inputs and network partners.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="about-sections">
          <p className="about-transition-line">This is the gap Civic Congruence is designed to solve.</p>

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
                    {s.example && <p className="about-example">{s.example}</p>}
                    <p>{s.body}</p>
                  </>
                ) : (
                  s.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                )}
              </div>
            </div>
          ))}

          {/* Get involved — appears before Who Is Behind This */}
          <div className="about-section about-section-contact">
            <div className="about-section-label">Get Involved</div>
            <div className="about-section-body">
              <p>
                If you represent a community organization, join the network. For media, policy, or civic infrastructure inquiries, reach out directly.
              </p>
              <div className="about-contact-actions">
                <button className="btn btn-primary" onClick={goToContact}>
                  Contact us
                </button>
              </div>
            </div>
          </div>

          {/* Why — last */}
          <div className="about-section">
            <div className="about-section-label">Origin</div>
            <div className="about-section-body">
              <h2>Why.</h2>
              <p>
                Civic Congruence was created by a civic media and community engagement leader with experience across local government, public media, and community networks. This project exists because the gap between what institutions think communities need and what communities are actually experiencing has become too wide to ignore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
