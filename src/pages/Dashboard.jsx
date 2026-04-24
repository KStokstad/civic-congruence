import { useState } from 'react'
import { fetchVerifiedSurveys } from '../services/airtable'

const SAMPLE = {
  totalResponses: 47,
  verifiedResponses: 31,
  dateRange: 'Apr 1 – Apr 16, 2026',
  topicsAvg: [
    { label: 'Economy',    score: 2.8 },
    { label: 'Safety',     score: 3.1 },
    { label: 'Health',     score: 3.4 },
    { label: 'Education',  score: 2.9 },
    { label: 'Governance', score: 2.2 },
  ],
  topIssues: {
    Economy: [
      { name: 'Housing costs',           pct: 42 },
      { name: 'Wage stagnation',         pct: 26 },
      { name: 'Job availability',        pct: 19 },
      { name: 'Infrastructure invest.',  pct: 8  },
      { name: 'Small business support',  pct: 5  },
    ],
    Safety: [
      { name: 'Mental health resources',       pct: 35 },
      { name: 'Youth programs',                pct: 28 },
      { name: 'Better lighting & infra.',      pct: 22 },
      { name: 'More community policing',       pct: 10 },
      { name: 'Neighborhood watch',            pct: 5  },
    ],
    Governance: [
      { name: 'Greater transparency',          pct: 44 },
      { name: 'More public input',             pct: 29 },
      { name: 'Faster response to issues',     pct: 16 },
      { name: 'Independent oversight',         pct: 7  },
      { name: 'Better communication',          pct: 4  },
    ],
  },
}

function getBarClass(score) {
  if (score < 2.5) return 'bar-low'
  if (score < 3.5) return 'bar-mid'
  return 'bar-high'
}

function SampleDashboard({ onReset }) {
  return (
    <div className="dashboard-data">
      <div className="data-notice">
        <span>⚠ This is sample data. Live data appears once verified responses are available.</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 12 }}>Preview how the system works</span>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 13 }}
          onClick={onReset}
        >
          Reset view
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Responses</div>
          <div className="stat-value">{SAMPLE.totalResponses}</div>
          <div className="stat-sub">all submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified</div>
          <div className="stat-value">{SAMPLE.verifiedResponses}</div>
          <div className="stat-sub">used in analysis</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lowest Score</div>
          <div className="stat-value">2.2</div>
          <div className="stat-sub">Governance</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Date Range</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>Apr 2026</div>
          <div className="stat-sub">{SAMPLE.dateRange}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Avg scores by topic */}
        <div className="chart-card">
          <h4>Avg. Satisfaction by Topic</h4>
          <div className="chart-subtitle">Scale 1–5 · {SAMPLE.verifiedResponses} verified responses</div>
          <div className="bar-chart">
            {SAMPLE.topicsAvg.map(({ label, score }) => (
              <div className="bar-row" key={label}>
                <div className="bar-label">{label}</div>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${getBarClass(score)}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <div className="bar-value">{score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top economy issues */}
        <div className="chart-card">
          <h4>Economy — Top Issues</h4>
          <div className="chart-subtitle">Most selected concern by respondents</div>
          <div className="breakdown-list">
            {SAMPLE.topIssues.Economy.map(({ name, pct }) => (
              <div className="breakdown-item" key={name}>
                <div className="breakdown-header">
                  <span className="breakdown-name">{name}</span>
                  <span className="breakdown-pct">{pct}%</span>
                </div>
                <div className="breakdown-track">
                  <div className="breakdown-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top safety improvements */}
        <div className="chart-card">
          <h4>Safety — Top Improvements Wanted</h4>
          <div className="chart-subtitle">Most selected response by respondents</div>
          <div className="breakdown-list">
            {SAMPLE.topIssues.Safety.map(({ name, pct }) => (
              <div className="breakdown-item" key={name}>
                <div className="breakdown-header">
                  <span className="breakdown-name">{name}</span>
                  <span className="breakdown-pct">{pct}%</span>
                </div>
                <div className="breakdown-track">
                  <div className="breakdown-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top governance improvements */}
        <div className="chart-card">
          <h4>Governance — What Would Build Trust</h4>
          <div className="chart-subtitle">Most selected response by respondents</div>
          <div className="breakdown-list">
            {SAMPLE.topIssues.Governance.map(({ name, pct }) => (
              <div className="breakdown-item" key={name}>
                <div className="breakdown-header">
                  <span className="breakdown-name">{name}</span>
                  <span className="breakdown-pct">{pct}%</span>
                </div>
                <div className="breakdown-track">
                  <div className="breakdown-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveDashboard({ records, onReset }) {
  const count = records.length

  const topicsAvg = [
    'Economy',
    'Safety',
    'Health',
    'Education',
    'Governance',
  ].map((label) => {
    const fieldMap = {
      Economy:    'Economy Scale',
      Safety:     'Safety Scale',
      Health:     'Health Scale',
      Education:  'Education Scale',
      Governance: 'Governance Scale',
    }
    const vals = records
      .map((r) => r.fields[fieldMap[label]])
      .filter((v) => typeof v === 'number')
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 'N/A'
    return { label, score: parseFloat(avg) || 0 }
  })

  const sortedByScore = [...topicsAvg].sort((a, b) => a.score - b.score)
  const lowestTopic = sortedByScore[0]

  return (
    <div className="dashboard-data">
      <div className="data-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
        <div>
          <div>✓ Showing live verified data</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Updated in real time</div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: 13 }}
          onClick={onReset}
        >
          Refresh
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Verified Responses</div>
          <div className="stat-value">{count}</div>
          <div className="stat-sub">used in analysis</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lowest Score</div>
          <div className="stat-value">
            {topicsAvg.length ? Math.min(...topicsAvg.map((t) => t.score)).toFixed(1) : '—'}
          </div>
          <div className="stat-sub">
            {lowestTopic?.label || '—'}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '-8px 0 20px' }}>
        Early data — patterns will strengthen as more responses come in.
      </p>

      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h4>
          Avg. Satisfaction by Topic
          <span className="verified-badge">✓ Verified</span>
        </h4>
        <div className="chart-subtitle">Scale 1–5 · {count} verified responses</div>
        <div className="bar-chart">
          {topicsAvg.map(({ label, score }) => (
            <div className="bar-row" key={label}>
              <div className="bar-label">{label}</div>
              <div className="bar-track">
                <div
                  className={`bar-fill ${getBarClass(score)}`}
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
              <div className="bar-value">{score || '—'}</div>
            </div>
          ))}
        </div>
        {lowestTopic && lowestTopic.score > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16, marginBottom: 0 }}>
            Currently, {lowestTopic.label} is the lowest-rated area among verified responses.
          </p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [mode, setMode] = useState('empty') // 'empty' | 'sample' | 'loading' | 'live' | 'error'
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)

  async function loadLiveData() {
    setMode('loading')
    setError(null)
    try {
      const data = await fetchVerifiedSurveys()
      setRecords(data)
      setMode('live')
    } catch (e) {
      setError(e.message)
      setMode('error')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <div className="section-label">Public Data</div>
            <h2>Civic Alignment Dashboard</h2>
          </div>
          {mode === 'empty' && (
            <div className="dashboard-actions">
              <button className="btn btn-ghost" onClick={() => setMode('sample')}>
                See example output
              </button>
              <button className="btn btn-primary" onClick={loadLiveData}>
                Load live data
              </button>
            </div>
          )}
        </div>

        {mode === 'empty' && (
          <div className="empty-state">

            <h3>No verified data yet.</h3>
            <p>
              This is what the system looks like before verified signal is coming in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setMode('sample')}>
                See example output
              </button>
              <button className="btn btn-ghost" onClick={loadLiveData}>
                Load live data
              </button>
            </div>
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
                Be one of the first to contribute signal.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => onNavigate?.('civic-survey')}
              >
                Take the Civic Survey
              </button>
            </div>
          </div>
        )}

        {mode === 'loading' && (
          <div className="loading-state">
            Loading verified responses from Airtable…
          </div>
        )}

        {mode === 'error' && (
          <>
            <div className="error-banner">
              Could not load data: {error}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setMode('empty')}>
                Back
              </button>
            </div>
          </>
        )}

        {mode === 'sample' && (
          <SampleDashboard onReset={() => setMode('empty')} />
        )}

        {mode === 'live' && (
          <LiveDashboard records={records} onReset={() => setMode('empty')} />
        )}
      </div>
    </div>
  )
}
