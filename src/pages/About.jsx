export default function About({ onNavigate }) {
  const sections = [
    {
      label: 'What This Is',
      headline: 'Civic Congruence builds infrastructure, not content.',
      body: 'Most decisions that affect people\u2019s lives are made with incomplete or delayed information. Community experience is scattered across surveys, meetings, and informal networks, while institutions rely on partial views.\n\nCivic Congruence connects community input, local networks, and institutional decision-making into a continuous feedback loop, so decisions reflect what people are actually experiencing.\n\nDesigned for communities, civic organizations, and institutions working with incomplete or outdated information.',
    },
    {
      label: 'How It Works',
      headline: 'Three inputs. One clear picture.',
      bullets: [
        'Civic Survey: what people are experiencing in their communities',
        'Political Alignment diagnostic: how people prioritize issues, weigh tradeoffs, and align with others',
        'Network Pulse: vetted organizations submit weekly brief updates',
      ],
      example: 'A local housing issue might show up in survey responses, be reinforced by community partners, and surface as something institutions can act on.',
      body: 'Together, these inputs reveal where agreement is stronger than expected, where real divides exist, and what institutions may be missing.',
    },
    {
      label: 'Data and Trust',
      headline: 'No editorial framing. No hidden weighting.',
      body: 'Survey responses are reviewed for validity, not interpretation. Network Pulse inputs are synthesized without attribution. Patterns surface as they appear consistently across inputs.\n\nCivic Congruence does not decide what matters. It makes visible what shows up repeatedly.',
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
          <p className="about-hero-lead">
            Congruence happens when what communities need matches what institutions provide. We make that visible.
          </p>
          <p className="about-hero-sub">
            Civic Congruence shows what&rsquo;s actually happening on the ground, as it happens. Not a media outlet. Not a think tank. A feedback system.
          </p>
          <p className="about-hero-sub">
            Currently being piloted with early community inputs and network partners.
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
            <div className="about-section-label">Why</div>
            <div className="about-section-body">
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
