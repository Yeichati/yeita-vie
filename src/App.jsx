import { useEffect, useMemo, useState } from 'react'

const DATA_ROOT = `${import.meta.env.BASE_URL}data`

async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Impossible de charger ${path}`)
  return response.json()
}

async function loadData() {
  const [app, manifest] = await Promise.all([
    getJson(`${DATA_ROOT}/app.json`),
    getJson(`${DATA_ROOT}/journeys/index.json`),
  ])

  const journeys = await Promise.all(
    manifest.journeys.map((filename) => getJson(`${DATA_ROOT}/journeys/${filename}`)),
  )

  return { app, journeys }
}

function StarterBox({ starter }) {
  if (!starter) return null

  return (
    <div className="starter-box">
      <div className="starter-mark">{starter.mark ?? '→'}</div>
      <div>
        <strong>{starter.title}</strong>
        <p>{starter.text}</p>
      </div>
    </div>
  )
}

function CardDialog({ card, cards, labels, onClose, onOpenCard }) {
  const byId = useMemo(() => Object.fromEntries(cards.map((item) => [item.id, item])), [cards])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!card) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="card-title">
        <button className="dialog-close" aria-label={labels.closeLabel} onClick={onClose}>×</button>
        <div className="dialog-inner">
          <span className="dialog-num">{labels.sheetLabel} {card.number}</span>
          <h2 id="card-title">{card.title}</h2>
          <p className="dialog-lead">{card.short}</p>

          <div className="why-box">
            <span>{labels.whyLabel}</span>
            <p>{card.why}</p>
          </div>

          <div className="detail-grid">
            <section className="detail-section">
              <h4>{labels.actionsLabel}</h4>
              <ul>{card.actions?.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section className="detail-section">
              <h4>{labels.questionsLabel}</h4>
              <ul>{card.questions?.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </div>

          {!!card.watchouts?.length && (
            <div className="watchout">
              <h4>{labels.watchoutsLabel}</h4>
              <ul>{card.watchouts.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}

          {!!card.next?.length && (
            <div className="next-links">
              {card.next.map((id) => byId[id] ? (
                <button key={id} onClick={() => onOpenCard(id)}>→ {byId[id].title}</button>
              ) : null)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [journeyId, setJourneyId] = useState(null)
  const [query, setQuery] = useState('')
  const [openCardId, setOpenCardId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
      .then((loaded) => {
        setData(loaded)
        setJourneyId(loaded.journeys[0]?.id ?? null)
      })
      .catch(setError)
  }, [])

  const journey = data?.journeys.find((item) => item.id === journeyId) ?? data?.journeys[0]

  const cards = useMemo(() => {
    if (!journey) return []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return journey.cards

    return journey.cards.filter((card) => {
      const searchable = [
        card.title,
        card.short,
        card.why,
        ...(card.actions ?? []),
        ...(card.questions ?? []),
        ...(card.watchouts ?? []),
      ].join(' ').toLowerCase()
      return searchable.includes(normalized)
    })
  }, [journey, query])

  const openCard = journey?.cards.find((card) => card.id === openCardId) ?? null

  if (error) {
    return <main className="status-page"><strong>Impossible de charger Yei'ta vie.</strong><span>{error.message}</span></main>
  }

  if (!data || !journey) {
    return <main className="status-page">Chargement…</main>
  }

  const { app, journeys } = data

  return (
    <>
      <div className="noise" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label={app.name}>
          <span className="brand-dot" />
          <span>{app.name}</span>
        </a>
        <div className="topbar-meta">{app.topbarLabel}</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{app.eyebrow}</span>
            <h1>{app.hero.title}<br /><span>{app.hero.highlight}</span></h1>
            <p>{app.hero.tagline}</p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            {app.hero.chips.map((chip, index) => (
              <span key={chip} className={`chip chip-${index}`}>{chip}</span>
            ))}
          </div>
        </section>

        <section className="journey-shell">
          <aside className="journey-sidebar">
            <div className="sidebar-title">{app.sidebar.title}</div>
            <nav className="journey-list">
              {journeys.map((item) => (
                <button
                  key={item.id}
                  className={`journey-button ${item.id === journey.id ? 'active' : ''}`}
                  onClick={() => {
                    setJourneyId(item.id)
                    setQuery('')
                    setOpenCardId(null)
                  }}
                >
                  {item.title}
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <strong>{app.sidebar.noteTitle}</strong>
              <span>{app.sidebar.noteText}</span>
            </div>
          </aside>

          <section className="journey-content">
            <div className="journey-heading">
              <div>
                <span className="section-kicker">{app.journey.kicker}</span>
                <h2>{journey.title}</h2>
                <p>{journey.subtitle}</p>
              </div>
              <div className="journey-tools">
                <label className="search-box">
                  <span>⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="search"
                    placeholder={app.journey.searchPlaceholder}
                  />
                </label>
              </div>
            </div>

            <StarterBox starter={journey.starter} />

            <div className="cards-grid">
              {cards.length ? cards.map((card) => (
                <article
                  key={card.id}
                  className="play-card"
                  tabIndex="0"
                  role="button"
                  aria-label={`Ouvrir ${card.title}`}
                  onClick={() => setOpenCardId(card.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setOpenCardId(card.id)
                    }
                  }}
                >
                  <span className="num">{card.number}</span>
                  <h3>{card.title}</h3>
                  <p>{card.short}</p>
                  <span className="open">↗</span>
                </article>
              )) : (
                <div className="empty">{app.journey.emptySearch}</div>
              )}
            </div>
          </section>
        </section>
      </main>

      {openCard && (
        <CardDialog
          card={openCard}
          cards={journey.cards}
          labels={app.card}
          onClose={() => setOpenCardId(null)}
          onOpenCard={setOpenCardId}
        />
      )}
    </>
  )
}
