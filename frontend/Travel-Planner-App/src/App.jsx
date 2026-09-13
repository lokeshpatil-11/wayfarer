import { Fragment, useState } from 'react'
import './App.css'

function toDisplayText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join('\n')
  }
  if (value && typeof value === 'object') {
    if ('text' in value) return toDisplayText(value.text)
    if ('content' in value) return toDisplayText(value.content)
    return JSON.stringify(value, null, 2)
  }
  return value == null ? '' : String(value)
}

function renderInlineMarkdown(text) {
  return text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={index}>{part.slice(2, -2)}</del>
    return <Fragment key={index}>{part}</Fragment>
  })
}

function parseTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function isBlockStart(line) {
  return /^(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+|---+$)/.test(line.trim())
}

function MarkdownContent({ content }) {
  const lines = content.split(/\r?\n/)
  const blocks = []
  let lineIndex = 0

  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim()
    if (!line) {
      lineIndex += 1
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const Heading = `h${heading[1].length}`
      blocks.push(<Heading key={lineIndex}>{renderInlineMarkdown(heading[2])}</Heading>)
      lineIndex += 1
      continue
    }

    if (/^(---+|\*\*\*+|___+)$/.test(line)) {
      blocks.push(<hr key={lineIndex} />)
      lineIndex += 1
      continue
    }

    if (line.startsWith('>')) {
      const quoteLines = []
      while (lineIndex < lines.length && lines[lineIndex].trim().startsWith('>')) {
        quoteLines.push(lines[lineIndex].trim().replace(/^>\s?/, ''))
        lineIndex += 1
      }
      blocks.push(<blockquote key={lineIndex}>{quoteLines.map((quoteLine, index) => <p key={index}>{renderInlineMarkdown(quoteLine)}</p>)}</blockquote>)
      continue
    }

    if (line.includes('|') && lineIndex + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[lineIndex + 1])) {
      const headers = parseTableRow(line)
      const rows = []
      lineIndex += 2
      while (lineIndex < lines.length && lines[lineIndex].trim().includes('|')) {
        rows.push(parseTableRow(lines[lineIndex]))
        lineIndex += 1
      }
      blocks.push(<div className="answer-table-wrap" key={lineIndex}><table><thead><tr>{headers.map((header, index) => <th key={index}>{renderInlineMarkdown(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(row[cellIndex] || '')}</td>)}</tr>)}</tbody></table></div>)
      continue
    }

    const listMatch = line.match(/^(?:[-*+]\s+|\d+\.\s+)(.*)$/)
    if (listMatch) {
      const ordered = /^\d+\./.test(line)
      const items = []
      while (lineIndex < lines.length) {
        const itemMatch = lines[lineIndex].trim().match(/^(?:[-*+]\s+|\d+\.\s+)(.*)$/)
        if (!itemMatch || (/^\d+\./.test(lines[lineIndex].trim()) !== ordered)) break
        items.push(itemMatch[1])
        lineIndex += 1
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(<List key={lineIndex}>{items.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}</List>)
      continue
    }

    const paragraphLines = [line]
    lineIndex += 1
    while (lineIndex < lines.length && lines[lineIndex].trim() && !isBlockStart(lines[lineIndex])) {
      paragraphLines.push(lines[lineIndex].trim())
      lineIndex += 1
    }
    blocks.push(<p key={lineIndex}>{renderInlineMarkdown(paragraphLines.join(' '))}</p>)
  }

  return <div className="markdown-content">{blocks}</div>
}

function App() {
  const [destination, setDestination] = useState('')
  const [activeNav, setActiveNav] = useState('Plan a trip')
  const [isSaved, setIsSaved] = useState(false)
  const [tripStarted, setTripStarted] = useState(false)
  const [isPlanning, setIsPlanning] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planAnswer, setPlanAnswer] = useState('')

  const popularPlaces = [
    { city: 'Lisbon', country: 'Portugal', emoji: '🇵🇹', color: 'sunset' },
    { city: 'Kyoto', country: 'Japan', emoji: '🇯🇵', color: 'sakura' },
    { city: 'Marrakech', country: 'Morocco', emoji: '🇲🇦', color: 'terracotta' },
  ]

  async function handlePlan(event) {
    event.preventDefault()
    if (!destination.trim()) {
      setPlanError('Tell us where you would like to go first.')
      return
    }

    setIsPlanning(true)
    setPlanError('')

    try {
      const params = new URLSearchParams({ user_input: destination })
      const response = await fetch(`/stream-travel?${params.toString()}`)
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'The planner could not complete this request.')
      }
      if (!response.body) throw new Error('The planner returned an empty response.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      setPlanAnswer('')
      setTripStarted(true)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setPlanAnswer(toDisplayText(answer))
      }

      answer += decoder.decode()
      setPlanAnswer(toDisplayText(answer) || 'Your itinerary is ready.')
    } catch (error) {
      setPlanError(error.message)
    } finally {
      setIsPlanning(false)
    }
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Wayfarer home"><span className="brand-mark">✦</span><span>wayfarer<span className="brand-dot">.</span></span></a>
        <div className="nav-links">
          {['Plan a trip', 'Explore', 'Saved'].map((item) => <button className={`nav-link ${activeNav === item ? 'active' : ''}`} key={item} onClick={() => setActiveNav(item)}>{item}{item === 'Saved' && <span className="saved-count">3</span>}</button>)}
        </div>
        <button className="profile-button" aria-label="Open profile"><span className="avatar">A</span><span className="profile-name">Alex</span><span className="chevron">⌄</span></button>
      </nav>

      <section className="workspace" id="top">
        <div className="intro-column">
          <div className="eyebrow"><span className="eyebrow-line" /> AI TRAVEL PLANNER</div>
          <h1>Go somewhere<br /><em>worth remembering.</em></h1>
          <p className="intro-copy">Tell us what you are dreaming about. We’ll turn it into a trip that feels entirely yours.</p>
          <form className="trip-form" onSubmit={handlePlan}>
            <label htmlFor="destination">Where do you want to go?</label>
            <div className="input-wrap">
              <span className="pin-icon">⌖</span>
              <input id="destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="A city, a country, or a feeling..." />
              <button className="surprise-button" type="button" onClick={() => setDestination('Somewhere unexpected')}>Surprise me</button>
            </div>
            <div className="form-footer"><span className="form-hint"><span className="sparkle">✧</span> Designed and developed by Lokesh Patil</span><button className="plan-button" type="submit" disabled={isPlanning}>{isPlanning ? 'Planning...' : tripStarted ? 'Trip started' : 'Start planning'} <span>→</span></button></div>
            {planError && <p className="form-message error-message" role="alert">{planError}</p>}
          </form>
          {planAnswer && <article className="plan-answer"><span className="answer-label">YOUR AI ITINERARY</span><MarkdownContent content={planAnswer} /></article>}
          <div className="quick-links"><span>Try one of these</span><div className="chip-row">{['A long weekend', 'Food & culture', 'Off the beaten path'].map((chip) => <button key={chip} onClick={() => setDestination(chip)}>{chip}</button>)}</div></div>
        </div>
      </section>

      <section className="popular-section"><div className="section-heading"><div><span className="eyebrow small">THE GOOD STUFF</span><h2>Places with a little <em>pull.</em></h2></div><button className="text-button" onClick={() => setActiveNav('Explore')}>View all <span>→</span></button></div><div className="place-grid">{popularPlaces.map((place) => <button className="place-card" key={place.city} onClick={() => setDestination(`${place.city}, ${place.country}`)}><div className={`place-art ${place.color}`}><span>{place.emoji}</span></div><div className="place-info"><strong>{place.city}</strong><span>{place.country}</span><span className="place-arrow">↗</span></div></button>)}</div></section>
      <footer><span>Made for the beautifully curious.</span><span>© 2025 wayfarer</span></footer>
    </main>
  )
}

export default App
