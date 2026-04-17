const BASE_ID = 'appyEX5eCOCKMruL7'
const TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN
const API = `https://api.airtable.com/v0/${BASE_ID}`

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
})

export async function submitSurvey(fields) {
  const res = await fetch(`${API}/Survey%20Response`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to submit survey')
  }
  return res.json()
}

export async function submitPulse(fields) {
  const res = await fetch(`${API}/Network%20Pulse`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to submit pulse')
  }
  return res.json()
}

export async function validateAccessCode(code) {
  const safeCode = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const params = new URLSearchParams({
    filterByFormula: `{Access Code}="${safeCode}"`,
    maxRecords: 1,
  })
  const res = await fetch(`${API}/Network%20Participants?${params}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to validate access code')
  }
  const data = await res.json()
  if (!data.records || data.records.length === 0) return null
  const fields = data.records[0].fields
  return {
    status: fields['Status'] || '',
    networkName: fields['Name'] || '',
  }
}

export async function fetchVerifiedSurveys() {
  const params = new URLSearchParams({ filterByFormula: '{Verified}=TRUE()' })
  const res = await fetch(`${API}/Survey%20Response?${params}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to fetch dashboard data')
  }
  const data = await res.json()
  return data.records || []
}
