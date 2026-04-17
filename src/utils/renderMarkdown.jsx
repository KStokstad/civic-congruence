function renderInline(text, keyPrefix) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyPrefix}-b${i}`}>{part}</strong> : part
  )
}

export function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let paraLines = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    elements.push(<ul key={key++}>{listItems}</ul>)
    listItems = []
  }

  function flushPara() {
    if (paraLines.length === 0) return
    const content = paraLines.join(' ').trim()
    if (content) elements.push(<p key={key++}>{renderInline(content, key)}</p>)
    paraLines = []
  }

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const li = line.match(/^[*-]\s+(.+)/)

    if (h3) {
      flushList(); flushPara()
      elements.push(<h3 key={key++}>{renderInline(h3[1], key)}</h3>)
    } else if (h2) {
      flushList(); flushPara()
      elements.push(<h2 key={key++}>{renderInline(h2[1], key)}</h2>)
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
