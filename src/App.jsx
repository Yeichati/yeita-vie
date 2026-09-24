import { useEffect, useMemo, useState } from 'react'

const DATA_ROOT = `${import.meta.env.BASE_URL}data`

async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Impossible de charger ${path}`)
  return response.json()
}

async function loadCollection(folder, manifestKey) {
  const manifest = await getJson(`${DATA_ROOT}/${folder}/index.json`)
  const filenames = manifest[manifestKey] ?? []
  const items = await Promise.all(
    filenames.map(async (filename) => ({
      filename,
      data: await getJson(`${DATA_ROOT}/${folder}/${filename}`),
    })),
  )
  return items
}

async function loadData() {
  const [app, journeyEntries, scenarioEntries] = await Promise.all([
    getJson(`${DATA_ROOT}/app.json`),
    loadCollection('journeys', 'journeys'),
    loadCollection('scenarios', 'scenarios'),
  ])

  return {
    app,
    journeys: journeyEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
    scenarios: scenarioEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
  }
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

function CardDialog({ card, labels, onClose, nextCard, onOpenNext }) {
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
          <div className="dialog-meta">
            <span className="dialog-num">{labels.sheetLabel} {card.number}</span>
            {card._sourceTitle && <span className="source-pill">{card._sourceTitle}</span>}
          </div>
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

          {nextCard && (
            <div className="scenario-next">
              <span>{labels.nextLabel}</span>
              <button onClick={() => onOpenNext(nextCard._key)}>→ {nextCard.title}</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Home({ app, journeys, scenarios, onChoose }) {
  return (
    <section className="home-shell">
      <div className="home-intro">
        <span className="section-kicker">{app.home.kicker}</span>
        <h2>{app.home.title}</h2>
        <p>{app.home.text}</p>
      </div>

      <div className="entry-grid">
        <button className="entry-card journey-entry" onClick={() => onChoose('journeys')}>
          <span className="entry-tag">{app.home.journeys.tag}</span>
          <strong>{app.home.journeys.title}</strong>
          <p>{app.home.journeys.text}</p>
          <div className="entry-footer">
            <span>{journeys.length} {app.home.journeys.countLabel}</span>
            <b>↗</b>
          </div>
        </button>

        <button className="entry-card scenario-entry" onClick={() => onChoose('scenarios')}>
          <span className="entry-tag">{app.home.scenarios.tag}</span>
          <strong>{app.home.scenarios.title}</strong>
          <p>{app.home.scenarios.text}</p>
          <div className="entry-footer">
            <span>{scenarios.length} {app.home.scenarios.countLabel}</span>
            <b>↗</b>
          </div>
        </button>
      </div>
    </section>
  )
}

function LibrarySidebar({ title, note, items, activeId, onSelect }) {
  return (
    <aside className="journey-sidebar">
      <div className="sidebar-title">{title}</div>
      <nav className="journey-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={`journey-button ${item.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            {item.title}
          </button>
        ))}
      </nav>
      {note && (
        <div className="sidebar-note">
          <strong>{note.title}</strong>
          <span>{note.text}</span>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [view, setView] = useState('home')
  const [journeyId, setJourneyId] = useState(null)
  const [scenarioId, setScenarioId] = useState(null)
  const [query, setQuery] = useState('')
  const [openCardKey, setOpenCardKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
      .then((loaded) => {
        setData(loaded)
        setJourneyId(loaded.journeys[0]?.id ?? null)
        setScenarioId(loaded.scenarios[0]?.id ?? null)
      })
      .catch(setError)
  }, [])

  const journey = data?.journeys.find((item) => item.id === journeyId) ?? data?.journeys[0]
  const scenario = data?.scenarios.find((item) => item.id === scenarioId) ?? data?.scenarios[0]

  const journeyByFilename = useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.journeys.map((item) => [item._filename, item]))
  }, [data])

  const scenarioCards = useMemo(() => {
    if (!scenario) return []
    return (scenario.cards ?? []).map((reference, index) => {
      const sourceJourney = journeyByFilename[reference.journey]
      const sourceCard = sourceJourney?.cards.find((card) => card.id === reference.cardId)
      if (!sourceJourney || !sourceCard) return null
      return {
        ...sourceCard,
        _key: `${reference.journey}:${reference.cardId}:${index}`,
        _sourceTitle: sourceJourney.title,
        _sourceFilename: reference.journey,
      }
    }).filter(Boolean)
  }, [scenario, journeyByFilename])

  const displayedCards = useMemo(() => {
    const source = view === 'scenarios'
      ? scenarioCards
      : (journey?.cards ?? []).map((card) => ({ ...card, _key: card.id }))

    const normalized = query.trim().toLowerCase()
    if (!normalized) return source

    return source.filter((card) => {
      const searchable = [
        card.title,
        card.short,
        card.why,
        card._sourceTitle,
        ...(card.actions ?? []),
        ...(card.questions ?? []),
        ...(card.watchouts ?? []),
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(normalized)
    })
  }, [view, journey, scenarioCards, query])

  const allActiveCards = view === 'scenarios'
    ? scenarioCards
    : (journey?.cards ?? []).map((card) => ({ ...card, _key: card.id }))

  const openCard = allActiveCards.find((card) => card._key === openCardKey) ?? null
  const openIndex = openCard ? allActiveCards.findIndex((card) => card._key === openCard._key) : -1
  const nextCard = openIndex >= 0 && openIndex < allActiveCards.length - 1 ? allActiveCards[openIndex + 1] : null

  if (error) {
    return <main className="status-page"><strong>Impossible de charger Yei'ta vie.</strong><span>{error.message}</span></main>
  }
  if (!data) return <main className="status-page">Chargement…</main>

  const { app, journeys, scenarios } = data
  const activeContent = view === 'scenarios' ? scenario : journey
  const contentLabels = view === 'scenarios' ? app.scenario : app.journey

  const goHome = () => {
    setView('home')
    setQuery('')
    setOpenCardKey(null)
  }

  const changeView = (nextView) => {
    setView(nextView)
    setQuery('')
    setOpenCardKey(null)
  }

  return (
    <>
      <div className="noise" />
      <header className="topbar">
        <button className="brand brand-button" onClick={goHome} aria-label={app.name}>
          <span className="brand-dot" />
          <span>{app.name}</span>
        </button>
        <nav className="top-nav" aria-label={app.navigation.label}>
          <button className={view === 'journeys' ? 'active' : ''} onClick={() => changeView('journeys')}>{app.navigation.journeys}</button>
          <button className={view === 'scenarios' ? 'active' : ''} onClick={() => changeView('scenarios')}>{app.navigation.scenarios}</button>
        </nav>
        <div className="topbar-meta">{app.topbarLabel}</div>
      </header>

      <main id="top">
        <section className={`hero ${view !== 'home' ? 'hero-compact' : ''}`}>
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

        {view === 'home' ? (
          <Home app={app} journeys={journeys} scenarios={scenarios} onChoose={changeView} />
        ) : (
          <section className="journey-shell">
            <LibrarySidebar
              title={view === 'scenarios' ? app.scenario.sidebarTitle : app.sidebar.title}
              note={view === 'scenarios'
                ? { title: app.scenario.noteTitle, text: app.scenario.noteText }
                : { title: app.sidebar.noteTitle, text: app.sidebar.noteText }}
              items={view === 'scenarios' ? scenarios : journeys}
              activeId={activeContent?.id}
              onSelect={(id) => {
                if (view === 'scenarios') setScenarioId(id)
                else setJourneyId(id)
                setQuery('')
                setOpenCardKey(null)
              }}
            />

            <section className="journey-content">
              <div className="journey-heading">
                <div>
                  <span className="section-kicker">{contentLabels.kicker}</span>
                  <h2>{activeContent?.title}</h2>
                  <p>{activeContent?.subtitle}</p>
                </div>
                <div className="journey-tools">
                  <label className="search-box">
                    <span>⌕</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      type="search"
                      placeholder={contentLabels.searchPlaceholder}
                    />
                  </label>
                </div>
              </div>

              <StarterBox starter={activeContent?.starter} />

              <div className="cards-grid">
                {displayedCards.length ? displayedCards.map((card, index) => (
                  <article
                    key={card._key}
                    className="play-card"
                    tabIndex="0"
                    role="button"
                    aria-label={`Ouvrir ${card.title}`}
                    onClick={() => setOpenCardKey(card._key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setOpenCardKey(card._key)
                      }
                    }}
                  >
                    <div className="card-topline">
                      <span className="num">{view === 'scenarios' ? String(index + 1).padStart(2, '0') : card.number}</span>
                      {card._sourceTitle && <span className="card-source">{card._sourceTitle}</span>}
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.short}</p>
                    <span className="open">↗</span>
                  </article>
                )) : (
                  <div className="empty">{contentLabels.emptySearch}</div>
                )}
              </div>
            </section>
          </section>
        )}
      </main>

      {openCard && (
        <CardDialog
          card={openCard}
          labels={app.card}
          onClose={() => setOpenCardKey(null)}
          nextCard={view === 'scenarios' ? nextCard : null}
          onOpenNext={setOpenCardKey}
        />
      )}
    </>
  )
}
