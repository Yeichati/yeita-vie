import { useEffect, useMemo, useRef, useState } from 'react'

const DATA_ROOT = `${import.meta.env.BASE_URL}data`
const ROLE_STORAGE_KEY = 'yeita-vie-role'

async function getJson(path) {
  const response = await fetch(path, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Impossible de charger ${path}`)
  return response.json()
}

async function loadCollection(folder, manifestKey) {
  const manifest = await getJson(`${DATA_ROOT}/${folder}/index.json`)
  const filenames = manifest[manifestKey] ?? []
  return Promise.all(
    filenames.map(async (filename) => ({
      filename,
      data: await getJson(`${DATA_ROOT}/${folder}/${filename}`),
    })),
  )
}

async function loadData() {
  const [app, roleData, journeyEntries, scenarioEntries] = await Promise.all([
    getJson(`${DATA_ROOT}/app.json`),
    getJson(`${DATA_ROOT}/roles.json`),
    loadCollection('journeys', 'journeys'),
    loadCollection('scenarios', 'scenarios'),
  ])

  return {
    app,
    roles: roleData.roles ?? [],
    journeys: journeyEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
    scenarios: scenarioEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
  }
}

function hasRole(item, roleId) {
  return item?.roles?.includes(roleId)
}

function RolePills({ roles, selectedRoleId, onChange, compact = false }) {
  return (
    <div className={`role-pills ${compact ? 'compact' : ''}`} role="group" aria-label="Choisir un rôle">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          className={role.id === selectedRoleId ? 'active' : ''}
          onClick={() => onChange(role.id)}
        >
          {compact && role.shortLabel ? role.shortLabel : role.label}
        </button>
      ))}
    </div>
  )
}

function RoleBadges({ roleIds, roleById }) {
  if (!roleIds?.length) return null
  return (
    <div className="role-badges">
      {roleIds.map((id) => {
        const role = roleById[id]
        if (!role) return null
        return <span key={id}>{role.shortLabel || role.label}</span>
      })}
    </div>
  )
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

function CardDialog({ card, labels, onClose, nextCard, onOpenNext, roleById }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    requestAnimationFrame(() => {
      if (dialogRef.current) dialogRef.current.scrollTop = 0
    })
  }, [card?._key, card?.id])

  if (!card) return null

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="card-title">
        <button className="dialog-close" aria-label={labels.closeLabel} onClick={onClose}>×</button>
        <div className="dialog-inner">
          <div className="dialog-meta">
            <span className="dialog-num">{labels.sheetLabel} {card.number}</span>
            {card._sourceTitle && <span className="source-pill">{card._sourceTitle}</span>}
            <RoleBadges roleIds={card.roles} roleById={roleById} />
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

function Home({ app, roles, selectedRoleId, onRoleChange, journeys, scenarios, onChoose }) {
  return (
    <section className="home-shell">
      <div className="role-home-block">
        <span className="section-kicker">{app.roleFilter.homeKicker}</span>
        <h2>{app.roleFilter.homeTitle}</h2>
        <p>{app.roleFilter.homeText}</p>
        <RolePills roles={roles} selectedRoleId={selectedRoleId} onChange={onRoleChange} />
      </div>

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

function RoleFilterBar({ app, roles, selectedRoleId, onRoleChange }) {
  const selected = roles.find((role) => role.id === selectedRoleId)
  return (
    <div className="role-filter-bar">
      <div className="role-filter-inner">
        <span className="role-filter-label">{app.roleFilter.barLabel}</span>
        <strong>{selected?.label}</strong>
        <RolePills roles={roles} selectedRoleId={selectedRoleId} onChange={onRoleChange} compact />
      </div>
    </div>
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
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [journeyId, setJourneyId] = useState(null)
  const [scenarioId, setScenarioId] = useState(null)
  const [query, setQuery] = useState('')
  const [openCardKey, setOpenCardKey] = useState(null)
  const [error, setError] = useState(null)
  const libraryRef = useRef(null)

  useEffect(() => {
    loadData()
      .then((loaded) => {
        setData(loaded)
        const stored = localStorage.getItem(ROLE_STORAGE_KEY)
        const validStored = loaded.roles.some((role) => role.id === stored)
        const initialRole = validStored ? stored : (loaded.roles.find((role) => role.id === 'product-manager')?.id ?? loaded.roles[0]?.id)
        setSelectedRoleId(initialRole)
      })
      .catch(setError)
  }, [])

  const roleById = useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.roles.map((role) => [role.id, role]))
  }, [data])

  const journeyByFilename = useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.journeys.map((item) => [item._filename, item]))
  }, [data])

  const filteredJourneys = useMemo(() => {
    if (!data || !selectedRoleId) return []
    return data.journeys.filter((journey) => journey.cards?.some((card) => hasRole(card, selectedRoleId)))
  }, [data, selectedRoleId])

  const filteredScenarios = useMemo(() => {
    if (!data || !selectedRoleId) return []
    return data.scenarios.filter((scenario) => hasRole(scenario, selectedRoleId))
  }, [data, selectedRoleId])

  useEffect(() => {
    if (!selectedRoleId) return
    localStorage.setItem(ROLE_STORAGE_KEY, selectedRoleId)
    setJourneyId((current) => filteredJourneys.some((item) => item.id === current) ? current : (filteredJourneys[0]?.id ?? null))
    setScenarioId((current) => filteredScenarios.some((item) => item.id === current) ? current : (filteredScenarios[0]?.id ?? null))
    setQuery('')
    setOpenCardKey(null)
  }, [selectedRoleId, filteredJourneys, filteredScenarios])

  const journey = filteredJourneys.find((item) => item.id === journeyId) ?? filteredJourneys[0]
  const scenario = filteredScenarios.find((item) => item.id === scenarioId) ?? filteredScenarios[0]

  useEffect(() => {
    if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    requestAnimationFrame(() => {
      libraryRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
  }, [view, journeyId, scenarioId, selectedRoleId])

  const scenarioCards = useMemo(() => {
    if (!scenario || !selectedRoleId) return []
    return (scenario.cards ?? []).map((reference, index) => {
      const sourceJourney = journeyByFilename[reference.journey]
      const sourceCard = sourceJourney?.cards.find((card) => card.id === reference.cardId)
      if (!sourceJourney || !sourceCard || !hasRole(sourceCard, selectedRoleId)) return null
      return {
        ...sourceCard,
        _key: `${reference.journey}:${reference.cardId}:${index}`,
        _sourceTitle: sourceJourney.title,
        _sourceFilename: reference.journey,
      }
    }).filter(Boolean)
  }, [scenario, selectedRoleId, journeyByFilename])

  const activeJourneyCards = useMemo(() => {
    if (!journey || !selectedRoleId) return []
    return (journey.cards ?? [])
      .filter((card) => hasRole(card, selectedRoleId))
      .map((card) => ({ ...card, _key: card.id }))
  }, [journey, selectedRoleId])

  const displayedCards = useMemo(() => {
    const source = view === 'scenarios' ? scenarioCards : activeJourneyCards
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
  }, [view, activeJourneyCards, scenarioCards, query])

  const allActiveCards = view === 'scenarios' ? scenarioCards : activeJourneyCards
  const openCard = allActiveCards.find((card) => card._key === openCardKey) ?? null
  const openIndex = openCard ? allActiveCards.findIndex((card) => card._key === openCard._key) : -1
  const nextCard = openIndex >= 0 && openIndex < allActiveCards.length - 1 ? allActiveCards[openIndex + 1] : null

  if (error) return <main className="status-page"><strong>Impossible de charger Yei'ta vie.</strong><span>{error.message}</span></main>
  if (!data || !selectedRoleId) return <main className="status-page">Chargement…</main>

  const { app, roles } = data
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
      </header>

      {view !== 'home' && (
        <RoleFilterBar app={app} roles={roles} selectedRoleId={selectedRoleId} onRoleChange={setSelectedRoleId} />
      )}

      <main id="top">
        {view === 'home' && (
          <section className="hero">
            <div className="hero-copy">
              <h1>{app.hero.title}<br /><span>{app.hero.highlight}</span></h1>
              <p>{app.hero.tagline}</p>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              {app.hero.chips.map((chip, index) => (
                <span key={chip} className={`chip chip-${index}`}>{chip}</span>
              ))}
            </div>
          </section>
        )}

        {view === 'home' ? (
          <Home
            app={app}
            roles={roles}
            selectedRoleId={selectedRoleId}
            onRoleChange={setSelectedRoleId}
            journeys={filteredJourneys}
            scenarios={filteredScenarios}
            onChoose={changeView}
          />
        ) : activeContent ? (
          <section ref={libraryRef} className="journey-shell">
            <LibrarySidebar
              title={view === 'scenarios' ? app.scenario.sidebarTitle : app.sidebar.title}
              note={view === 'scenarios'
                ? { title: app.scenario.noteTitle, text: app.scenario.noteText }
                : { title: app.sidebar.noteTitle, text: app.sidebar.noteText }}
              items={view === 'scenarios' ? filteredScenarios : filteredJourneys}
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
                  <div className="heading-meta-row">
                    <span className="section-kicker">{contentLabels.kicker}</span>
                    {view === 'scenarios' && <RoleBadges roleIds={scenario?.roles} roleById={roleById} />}
                  </div>
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
                    <RoleBadges roleIds={card.roles} roleById={roleById} />
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
        ) : (
          <section className="empty-library">Aucun contenu n'est disponible pour ce rôle.</section>
        )}
      </main>

      <footer className="site-footer">
        <span>{app.footer?.prefix}</span>{' '}
        <a href={app.footer?.url} target="_blank" rel="noreferrer">{app.footer?.label}</a>{' '}
        <span>{app.footer?.suffix}</span>
      </footer>

      {openCard && (
        <CardDialog
          card={openCard}
          labels={app.card}
          onClose={() => setOpenCardKey(null)}
          nextCard={view === 'scenarios' ? nextCard : null}
          onOpenNext={setOpenCardKey}
          roleById={roleById}
        />
      )}
    </>
  )
}
