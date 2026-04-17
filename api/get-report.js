const AIRTABLE_API = 'https://api.airtable.com/v0/appyEX5eCOCKMruL7'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session_id } = req.query

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' })
  }

  const safeId = session_id.replace(/"/g, '\\"')
  const params = new URLSearchParams({
    filterByFormula: `{Stripe Session}="${safeId}"`,
    maxRecords: 1,
  })
  params.append('fields[]', 'Report')
  params.append('fields[]', 'Report Generated')

  console.log('get-report: session_id =', session_id)
  console.log('get-report: token present =', !!process.env.VITE_AIRTABLE_TOKEN)

  try {
    const airtableRes = await fetch(`${AIRTABLE_API}/Alignment%20Response?${params}`, {
      headers: { Authorization: `Bearer ${process.env.VITE_AIRTABLE_TOKEN}` },
    })

    if (!airtableRes.ok) {
      const rawError = await airtableRes.text()
      console.error('get-report Airtable error status:', airtableRes.status)
      console.error('get-report Airtable error body:', rawError)
      let errMsg
      try { errMsg = JSON.parse(rawError)?.error?.message } catch {}
      return res.status(502).json({ error: errMsg || rawError || 'Airtable error' })
    }

    const data = await airtableRes.json()
    const record = data.records?.[0]

    if (!record) {
      return res.status(200).json({ generated: false, report: null })
    }

    return res.status(200).json({
      generated: record.fields['Report Generated'] === true,
      report: record.fields['Report'] ?? null,
    })
  } catch (err) {
    console.error('get-report error:', err)
    return res.status(500).json({ error: err.message })
  }
}
