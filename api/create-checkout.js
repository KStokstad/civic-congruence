import Stripe from 'stripe'

const AIRTABLE_API = 'https://api.airtable.com/v0/appyEX5eCOCKMruL7'

async function saveSessionToAirtable(recordId, sessionId) {
  const url = `${AIRTABLE_API}/Alignment%20Response/${recordId}`
  const fields = { 'Session ID': sessionId }
  const body = JSON.stringify({ fields })

  console.log('Airtable PATCH url:', url)
  console.log('Airtable PATCH recordId:', recordId)
  console.log('Airtable PATCH fields:', JSON.stringify(fields))
  console.log('Airtable PATCH body:', body)
  console.log('Airtable token present:', !!process.env.VITE_AIRTABLE_TOKEN)

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.VITE_AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  const responseText = await res.text()
  console.log('Airtable PATCH status:', res.status)
  console.log('Airtable PATCH response:', responseText)

  if (!res.ok) {
    let errMsg
    try { errMsg = JSON.parse(responseText)?.error?.message } catch {}
    throw new Error(`Airtable ${res.status}: ${errMsg || responseText}`)
  }
  return JSON.parse(responseText)
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, alignmentData, sessionId, airtableRecordId } = req.body

    console.log('create-checkout invoked', {
      email,
      sessionId,
      airtableRecordId,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasPriceId: !!process.env.STRIPE_PRICE_ID,
      hasSiteUrl: !!process.env.VITE_SITE_URL,
    })

    if (!email || !sessionId) {
      return res.status(400).json({ error: 'email and sessionId are required' })
    }

    // Save Session ID to Airtable — non-blocking
    if (airtableRecordId) {
      try {
        await saveSessionToAirtable(airtableRecordId, sessionId)
        console.log('Airtable session save succeeded')
      } catch (err) {
        console.error('Airtable session save failed (non-fatal):', err.message)
      }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.VITE_SITE_URL}/report?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VITE_SITE_URL}/political-alignment`,
      metadata: {
        email,
        sessionId,
        alignmentData: JSON.stringify(alignmentData ?? {}),
      },
    })

    console.log('Stripe session created:', session.id)
    return res.status(200).json({ url: session.url })

  } catch (err) {
    console.error('create-checkout unhandled error:', err.message)
    console.error('Stack:', err.stack)
    return res.status(500).json({
      error: err.message,
      type: err.constructor?.name ?? 'Error',
      ...(err.type && { stripeType: err.type }),
      ...(err.code && { stripeCode: err.code }),
    })
  }
}
