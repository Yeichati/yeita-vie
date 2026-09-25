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
  const [app, roleData, journeyEntries, scenarioEntries, yekigaiEntries] = await Promise.all([
    getJson(`${DATA_ROOT}/app.json`),
    getJson(`${DATA_ROOT}/roles.json`),
    loadCollection('journeys', 'journeys'),
    loadCollection('scenarios', 'scenarios'),
    loadCollection('yekigai', 'decks'),
  ])

  return {
    app,
    roles: roleData.roles ?? [],
    journeys: journeyEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
    scenarios: scenarioEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
    yekigaiDecks: yekigaiEntries.map(({ filename, data }) => ({ ...data, _filename: filename })),
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

function Home({ app, roles, selectedRoleId, onRoleChange, journeys, scenarios, yekigaiDecks, onChoose }) {
  const cardsPerDeck = yekigaiDecks[0]?.cards?.length ?? 0
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

        <button className="entry-card yekigai-entry" onClick={() => onChoose('yekigai')}>
          <span className="entry-tag">{app.home.yekigai.tag}</span>
          <strong>{app.home.yekigai.title}</strong>
          <p>{app.home.yekigai.text}</p>
          <div className="entry-footer">
            <span>{cardsPerDeck} {app.home.yekigai.countLabel}</span>
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

function ChoiceCard({ card, selected, onClick }) {
  return (
    <button type="button" className={`yekigai-choice-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="yekigai-card-meta">
        <span>{card.theme}</span>
      </div>
      <strong>{card.statement}</strong>
      <span className="choice-check">{selected ? '✓' : '+'}</span>
    </button>
  )
}

function YekigaiPage({ app, decks, roles, initialRoleId }) {
  const labels = app.yekigai
  const [deckId, setDeckId] = useState(() => decks.find((deck) => deck.roleId === initialRoleId)?.id ?? decks[0]?.id)
  const [phase, setPhase] = useState('landing')
  const [positiveIds, setPositiveIds] = useState([])
  const [negativeIds, setNegativeIds] = useState([])
  const [discussionIndex, setDiscussionIndex] = useState(0)
  const [notes, setNotes] = useState({})
  const [copied, setCopied] = useState(false)

  const deck = decks.find((item) => item.id === deckId) ?? decks[0]
  const cards = deck?.cards ?? []
  const roleById = Object.fromEntries(roles.map((role) => [role.id, role]))

  useEffect(() => {
    if (phase !== 'landing') return
    const matching = decks.find((item) => item.roleId === initialRoleId)
    if (matching) setDeckId(matching.id)
  }, [initialRoleId, decks, phase])

  const resetSession = (nextDeckId = deckId) => {
    setDeckId(nextDeckId)
    setPhase('landing')
    setPositiveIds([])
    setNegativeIds([])
    setDiscussionIndex(0)
    setNotes({})
    setCopied(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const startSession = () => {
    setPhase('discover')
    setPositiveIds([])
    setNegativeIds([])
    setDiscussionIndex(0)
    setNotes({})
    setCopied(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const toggleSelection = (id, setSelectedIds, limit) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id)
      if (previous.length >= limit) return previous
      return [...previous, id]
    })
  }

  const discussionCards = useMemo(() => {
    const positives = positiveIds.map((id) => ({ ...cards.find((card) => card.id === id), _stance: 'positive' })).filter((card) => card.id)
    const negatives = negativeIds.map((id) => ({ ...cards.find((card) => card.id === id), _stance: 'negative' })).filter((card) => card.id)
    return [...positives, ...negatives]
  }, [positiveIds, negativeIds, cards])

  const buildSummary = () => {
    const roleName = roleById[deck?.roleId]?.label ?? deck?.title ?? ''
    const lines = [`Yekigai — ${roleName}`, '']
    lines.push('3 cartes qui me ressemblent le plus')
    positiveIds.forEach((id) => {
      const card = cards.find((item) => item.id === id)
      if (card) lines.push(`- ${card.statement}${notes[id] ? `\n  Notes : ${notes[id]}` : ''}`)
    })
    lines.push('', '2 cartes qui me ressemblent le moins')
    negativeIds.forEach((id) => {
      const card = cards.find((item) => item.id === id)
      if (card) lines.push(`- ${card.statement}${notes[id] ? `\n  Notes : ${notes[id]}` : ''}`)
    })
    return lines.join('\n')
  }

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  if (!deck) return <section className="yekigai-shell"><div className="empty">Aucun jeu Yekigai disponible.</div></section>

  if (phase === 'landing') {
    return (
      <section className="yekigai-shell yekigai-landing">
        <div className="yekigai-hero">
          <div>
            <span className="section-kicker">{labels.kicker}</span>
            <h1>{labels.title}</h1>
            <p>{labels.text}</p>
          </div>
          <div className="yekigai-rules">
            <span>{labels.duration}</span>
            <strong>12 cartes → 3 + 2 → discussion</strong>
            <p>{labels.landingNote}</p>
          </div>
        </div>

        <div className="deck-section">
          <span className="section-kicker">{labels.chooseDeck}</span>
          <div className="deck-grid">
            {decks.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`deck-card ${item.id === deckId ? 'selected' : ''}`}
                onClick={() => setDeckId(item.id)}
              >
                <span>{roleById[item.roleId]?.shortLabel ?? 'JEU'}</span>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <small>{item.cards?.length ?? 0} cartes</small>
              </button>
            ))}
          </div>
          <button type="button" className="yekigai-primary" onClick={startSession}>{labels.start} →</button>
        </div>
      </section>
    )
  }

  if (phase === 'discover') {
    return (
      <section className="yekigai-session-shell wide">
        <div className="yekigai-step-head">
          <div>
            <span className="section-kicker">ÉTAPE 1 · DÉCOUVERTE</span>
            <h2>{labels.discover.title}</h2>
            <p>{labels.discover.text}</p>
          </div>
          <strong>{cards.length} cartes</strong>
        </div>
        <div className="yekigai-choice-grid discover-grid">
          {cards.map((card) => (
            <article key={card.id} className="yekigai-choice-card discover-card">
              <div className="yekigai-card-meta"><span>{card.theme}</span></div>
              <strong>{card.statement}</strong>
            </article>
          ))}
        </div>
        <div className="yekigai-bottom-actions">
          <button type="button" className="yekigai-secondary" onClick={() => setPhase('landing')}>← Changer de jeu</button>
          <button type="button" className="yekigai-primary" onClick={() => setPhase('positive')}>Faire mes choix →</button>
        </div>
      </section>
    )
  }

  if (phase === 'positive') {
    return (
      <section className="yekigai-session-shell wide">
        <div className="yekigai-step-head">
          <div>
            <span className="section-kicker">ÉTAPE 2 · LE PLUS</span>
            <h2>{labels.pickPositive.title}</h2>
            <p>{labels.pickPositive.text}</p>
          </div>
          <strong>{positiveIds.length} / 3</strong>
        </div>
        <div className="yekigai-choice-grid">
          {cards.map((card) => (
            <ChoiceCard
              key={card.id}
              card={card}
              selected={positiveIds.includes(card.id)}
              onClick={() => toggleSelection(card.id, setPositiveIds, 3)}
            />
          ))}
        </div>
        <div className="yekigai-bottom-actions">
          <button type="button" className="yekigai-secondary" onClick={() => setPhase('discover')}>← Revoir les cartes</button>
          <button type="button" className="yekigai-primary" disabled={positiveIds.length !== 3} onClick={() => { setNegativeIds([]); setPhase('negative') }}>Continuer →</button>
        </div>
      </section>
    )
  }

  if (phase === 'negative') {
    const remainingCards = cards.filter((card) => !positiveIds.includes(card.id))
    return (
      <section className="yekigai-session-shell wide">
        <div className="yekigai-step-head">
          <div>
            <span className="section-kicker">ÉTAPE 3 · LE MOINS</span>
            <h2>{labels.pickNegative.title}</h2>
            <p>{labels.pickNegative.text}</p>
          </div>
          <strong>{negativeIds.length} / 2</strong>
        </div>
        <div className="yekigai-choice-grid">
          {remainingCards.map((card) => (
            <ChoiceCard
              key={card.id}
              card={card}
              selected={negativeIds.includes(card.id)}
              onClick={() => toggleSelection(card.id, setNegativeIds, 2)}
            />
          ))}
        </div>
        <div className="yekigai-bottom-actions">
          <button type="button" className="yekigai-secondary" onClick={() => setPhase('positive')}>← Revenir aux 3 cartes</button>
          <button
            type="button"
            className="yekigai-primary"
            disabled={negativeIds.length !== 2}
            onClick={() => { setDiscussionIndex(0); setPhase('discussion') }}
          >
            Passer à la discussion →
          </button>
        </div>
      </section>
    )
  }

  if (phase === 'discussion') {
    const card = discussionCards[discussionIndex]
    const isLast = discussionIndex === discussionCards.length - 1
    return (
      <section className="yekigai-session-shell discuss-shell">
        <div className="yekigai-step-head">
          <div>
            <span className="section-kicker">ÉTAPE 4 · DISCUSSION</span>
            <h2>{labels.discussion.title}</h2>
            <p>{labels.discussion.text}</p>
          </div>
          <strong>{discussionIndex + 1} / {discussionCards.length}</strong>
        </div>

        <article className={`discussion-card ${card._stance}`}>
          <div className="discussion-statement">
            <span>{card._stance === 'positive' ? 'ME RESSEMBLE LE PLUS' : 'ME RESSEMBLE LE MOINS'} · {card.theme}</span>
            <h3>{card.statement}</h3>
          </div>
          <div className="discussion-grid">
            <section>
              <h4>{labels.discussion.promptsLabel}</h4>
              <ul>{card.prompts?.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
            </section>
            <section>
              <h4>{labels.discussion.signalsLabel}</h4>
              <div className="signal-pills">{card.signals?.map((signal) => <span key={signal}>{signal}</span>)}</div>
            </section>
          </div>
          <label className="notes-field">
            <span>{labels.discussion.notesLabel}</span>
            <textarea
              value={notes[card.id] ?? ''}
              onChange={(event) => setNotes((previous) => ({ ...previous, [card.id]: event.target.value }))}
              placeholder={labels.discussion.notesPlaceholder}
              rows="5"
            />
          </label>
        </article>

        <div className="yekigai-bottom-actions">
          <button
            type="button"
            className="yekigai-secondary"
            disabled={discussionIndex === 0}
            onClick={() => setDiscussionIndex((index) => Math.max(0, index - 1))}
          >
            ← Précédente
          </button>
          <button
            type="button"
            className="yekigai-primary"
            onClick={() => isLast ? setPhase('summary') : setDiscussionIndex((index) => index + 1)}
          >
            {isLast ? 'Voir la synthèse →' : 'Carte suivante →'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="yekigai-session-shell wide summary-shell">
      <div className="yekigai-step-head">
        <div>
          <span className="section-kicker">TERMINÉ</span>
          <h2>{labels.summary.title}</h2>
          <p>{labels.summary.text}</p>
        </div>
        <strong>{deck.title}</strong>
      </div>

      <div className="summary-columns">
        <section className="summary-block positive">
          <h3>{labels.summary.positiveLabel}</h3>
          {positiveIds.map((id) => {
            const card = cards.find((item) => item.id === id)
            return (
              <article key={id}>
                <span>{card.theme}</span>
                <strong>{card.statement}</strong>
                {notes[id] && <p>{notes[id]}</p>}
              </article>
            )
          })}
        </section>
        <section className="summary-block negative">
          <h3>{labels.summary.negativeLabel}</h3>
          {negativeIds.map((id) => {
            const card = cards.find((item) => item.id === id)
            return (
              <article key={id}>
                <span>{card.theme}</span>
                <strong>{card.statement}</strong>
                {notes[id] && <p>{notes[id]}</p>}
              </article>
            )
          })}
        </section>
      </div>

      <div className="yekigai-bottom-actions summary-actions">
        <button type="button" className="yekigai-secondary" onClick={copySummary}>{copied ? 'Copié ✓' : labels.summary.copy}</button>
        <button type="button" className="yekigai-primary" onClick={() => resetSession()}>{labels.summary.restart}</button>
      </div>
    </section>
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
    if (view === 'home' || view === 'yekigai') {
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

  const { app, roles, yekigaiDecks } = data
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
        <nav className="top-nav primary-nav" aria-label={app.navigation.label}>
          <button className={view === 'journeys' ? 'active' : ''} onClick={() => changeView('journeys')}>{app.navigation.journeys}</button>
          <button className={view === 'scenarios' ? 'active' : ''} onClick={() => changeView('scenarios')}>{app.navigation.scenarios}</button>
          <button className={view === 'yekigai' ? 'active' : ''} onClick={() => changeView('yekigai')}>{app.navigation.yekigai}</button>
        </nav>
      </header>

      {(view === 'journeys' || view === 'scenarios') && (
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
            yekigaiDecks={yekigaiDecks}
            onChoose={changeView}
          />
        ) : view === 'yekigai' ? (
          <YekigaiPage app={app} decks={yekigaiDecks} roles={roles} initialRoleId={selectedRoleId} />
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
