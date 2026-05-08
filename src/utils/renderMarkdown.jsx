export function renderInline(text, keyPrefix) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-b${i}`}>{part}</strong> : part
  )
}

function splitLongPara(content) {
  if (content.length <= 450) return [content]
  const re = /[.!?]\s+(?=[A-Z])/g
  const positions = []
  let m
  while ((m = re.exec(content)) !== null) {
    positions.push(m.index + 1)
  }
  if (positions.length < 3) return [content]
  const splitAt = positions[Math.floor(positions.length / 2)]
  const a = content.slice(0, splitAt).trim()
  const b = content.slice(splitAt).trim()
  return a.length >= 100 && b.length >= 100 ? [a, b] : [content]
}

function isCallout(content) {
  if (content.length < 90 || content.length > 210) return false
  const endings = (content.match(/[.!?]/g) || []).length
  return endings <= 2
}

export function renderMarkdown(text, subLines = {}) {
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let paraLines = []
  let key = 0
  let afterHeading = false

  function flushList() {
    if (listItems.length === 0) return
    elements.push(<ul key={key++}>{listItems}</ul>)
    listItems = []
    afterHeading = false
  }

  function flushPara() {
    if (paraLines.length === 0) return
    const content = paraLines.join(' ').trim()
    paraLines = []
    if (!content) return
    const wasAfterHeading = afterHeading
    afterHeading = false
    const chunks = splitLongPara(content)
    chunks.forEach((chunk, i) => {
      if (!wasAfterHeading && i === 0 && isCallout(chunk)) {
        elements.push(<p key={key++} className="report-callout">{renderInline(chunk, key)}</p>)
      } else {
        elements.push(<p key={key++}>{renderInline(chunk, key)}</p>)
      }
    })
  }

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const hr = /^(-{3,}|\*{3,})$/.test(line.trim())
    const li = line.match(/^[*-]\s+(.+)/)

    if (hr) {
      flushList(); flushPara()
      elements.push(<hr key={key++} />)
    } else if (h3) {
      flushList(); flushPara()
      elements.push(<h3 key={key++}>{renderInline(h3[1], key)}</h3>)
      afterHeading = true
    } else if (h2) {
      flushList(); flushPara()
      elements.push(<h2 key={key++}>{renderInline(h2[1], key)}</h2>)
      if (subLines[h2[1]]) {
        elements.push(
          <p key={key++} style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 'normal', marginTop: 3, marginBottom: 16, lineHeight: 1.5 }}>
            {renderInline(subLines[h2[1]], key)}
          </p>
        )
      }
      afterHeading = true
    } else if (h1) {
      flushList(); flushPara()
      elements.push(<h1 key={key++}>{renderInline(h1[1], key)}</h1>)
      afterHeading = true
    } else if (li) {
      flushPara()
      listItems.push(<li key={key++}>{renderInline(li[1], key)}</li>)
    } else if (line.trim() === '') {
      flushList(); flushPara()
    } else {
      flushList()
      paraLines.push(line)
    }
  }

  flushList()
  flushPara()

  return elements
}
