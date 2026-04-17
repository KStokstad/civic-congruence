import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()])
)

const TOKEN = env.VITE_AIRTABLE_TOKEN
const BASE_ID = 'appyEX5eCOCKMruL7'
const TABLE = 'Survey Response'

if (!TOKEN) {
  console.error('VITE_AIRTABLE_TOKEN not found in .env')
  process.exit(1)
}

const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?maxRecords=3`

console.log('GET', url)
console.log('Authorization: Bearer', TOKEN.slice(0, 16) + '…')
console.log()

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${TOKEN}` },
})

console.log('Status:', res.status, res.statusText)
console.log()

const body = await res.json()
console.log(JSON.stringify(body, null, 2))
