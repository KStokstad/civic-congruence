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

export async function submitAlignment(fields) {
  const res = await fetch(`${API}/Alignment%20Response`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to save alignment response')
  }
  return res.json()
}

export async function checkRepeatEmail(email) {
  const safeEmail = email.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const params = new URLSearchParams({
    filterByFormula: `AND({Report Email}="${safeEmail}",{Report Generated}=TRUE())`,
    maxRecords: 1,
  })
  params.append('fields[]', 'Report Email')
  const res = await fetch(`${API}/Alignment%20Response?${params}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) return false
  const data = await res.json()
  return (data.records?.length ?? 0) > 0
}

export async function updateAlignment(recordId, fields) {
  const res = await fetch(`${API}/Alignment%20Response/${recordId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to update alignment record')
  }
  return res.json()
}

export async function submitContact(fields) {
  const res = await fetch(`${API}/Contact`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to submit contact form')
  }
  return res.json()
}

export async function submitApplication(fields) {
  const res = await fetch(`${API}/Network%20Participants`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to submit application')
  }
  return res.json()
}

export async function submitSubscriber(fields) {
  const res = await fetch(`${API}/Subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Failed to subscribe')
  }
  return res.json()
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
