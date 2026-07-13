import { useState } from 'react'
import SystemWindow from '../components/SystemWindow.jsx'
import MissionManager from '../components/MissionManager.jsx'
import SportIcon from '../components/SportIcon.jsx'
import { activePlan } from '../store.js'
import { newId } from '../logic/ids.js'
import { WEEKDAY_NAMES, addDays, formatKey, todayKey, toKey, weekStart } from '../logic/dates.js'
import { parsePlan } from '../logic/parser.js'
import { mergeStravaActivities, parseStravaActivities } from '../logic/strava.js'
import { applyXp } from '../logic/xp.js'
import { SPORTS } from '../logic/sports.js'

function PlanDays({ days, onMove, editingWd, onEditDay, onSaveDay, onCancelEdit }) {
  const [dragWd, setDragWd] = useState(null)
  const [hoverWd, setHoverWd] = useState(null)

  function wdAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('[data-wd]')
    return el ? Number(el.dataset.wd) : null
  }

  function startDrag(e, wd) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragWd(wd)
    setHoverWd(wd)
  }

  function moveDrag(e) {
    if (dragWd == null) return
    setHoverWd(wdAt(e.clientX, e.clientY))
  }

  function endDrag() {
    if (dragWd != null && hoverWd != null && hoverWd !== dragWd) onMove(dragWd, hoverWd)
    setDragWd(null)
    setHoverWd(null)
  }

  function cancelDrag() {
    setDragWd(null)
    setHoverWd(null)
  }

  function cardClass(wd, rest) {
    return (
      'day-card' +
      (rest ? ' rest' : '') +
      (dragWd === wd ? ' dragging' : '') +
      (dragWd != null && hoverWd === wd && wd !== dragWd ? ' drop-target' : '')
    )
  }

  const handle = (wd) =>
    onMove && (
      <span
        className="drag-handle"
        onPointerDown={(e) => startDrag(e, wd)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      >
        ⠿
      </span>
    )

  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
        const day = days.find((d) => d.weekday === wd && d.exercises.length > 0)
        if (editingWd === wd) {
          return (
            <DayEditor
              key={wd}
              day={day || { weekday: wd, title: '', sport: 'weights', exercises: [] }}
              onSave={onSaveDay}
              onCancel={onCancelEdit}
            />
          )
        }
        return day ? (
          <div key={wd} className={cardClass(wd, false)} data-wd={wd}>
            <div className="day-name">
              {WEEKDAY_NAMES[wd - 1]}
              {handle(wd)}
            </div>
            <div className="day-title">
              <SportIcon sport={day.sport || 'weights'} size={16} /> {day.title}
            </div>
            <ul>
              {day.exercises.map((e, i) => (
                <li key={i}>
                  {e.name}
                  {e.sets && e.reps ? ` — ${e.sets} × ${e.reps}` : ''}
                  {e.weight ? ` @ ${e.weight}` : ''}
                </li>
              ))}
            </ul>
            {onEditDay && (
              <button className="goal-edit-btn" onClick={() => onEditDay(wd)}>✎ modifica</button>
            )}
          </div>
        ) : (
          <div key={wd} className={cardClass(wd, true)} data-wd={wd}>
            <div className="day-name">{WEEKDAY_NAMES[wd - 1]}</div>
            <div className="day-title">Riposo</div>
            {onEditDay && (
              <button className="goal-edit-btn" onClick={() => onEditDay(wd)}>+ aggiungi allenamento</button>
            )}
          </div>
        )
      })}
    </>
  )
}

// Editor di un singolo giorno del piano attivo: titolo, sport, esercizi con
// note. Titolo vuoto e nessun esercizio = il giorno torna riposo.
function DayEditor({ day, onSave, onCancel }) {
  const [title, setTitle] = useState(day.title || '')
  const [sport, setSport] = useState(day.sport || 'weights')
  const [exercises, setExercises] = useState(() =>
    day.exercises.length > 0
      ? day.exercises.map((e) => ({ ...e }))
      : [{ name: '', sets: '', reps: '', weight: '', notes: '' }],
  )

  function updateEx(i, field, value) {
    setExercises((prev) => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)))
  }

  function save() {
    const clean = exercises
      .filter((e) => String(e.name).trim())
      .map((e) => ({ ...e, name: e.name.trim() }))
    onSave({
      ...day,
      title: title.trim() || (clean.length > 0 ? SPORTS[sport].label : ''),
      sport,
      exercises: clean,
    })
  }

  return (
    <div className="day-card editing">
      <div className="day-name">{WEEKDAY_NAMES[day.weekday - 1]}</div>
      <div className="sport-chips" style={{ margin: '8px 0' }}>
        {Object.entries(SPORTS).map(([key, s]) => (
          <button
            key={key}
            className={'sport-chip' + (sport === key ? ' on' : '')}
            onClick={() => setSport(key)}
          >
            <SportIcon sport={key} size={16} /> {s.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Titolo workout (vuoto = riposo)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ margin: '6px 0' }}
      />
      {exercises.map((e, i) => (
        <div key={i} className="edit-ex-block">
          <div className="edit-ex-row">
            <input
              className="ex-name"
              type="text"
              placeholder="Esercizio"
              value={e.name}
              onChange={(ev) => updateEx(i, 'name', ev.target.value)}
            />
            <input
              className="ex-num"
              type="text"
              placeholder="Serie"
              value={e.sets}
              onChange={(ev) => updateEx(i, 'sets', ev.target.value)}
            />
            <input
              className="ex-num"
              type="text"
              placeholder="Rip."
              value={e.reps}
              onChange={(ev) => updateEx(i, 'reps', ev.target.value)}
            />
            <button
              className="remove-ex"
              onClick={() => setExercises((p) => p.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
          <input
            className="ex-notes"
            type="text"
            placeholder="Note (es. ritmo 5:16/km)"
            value={e.notes || ''}
            onChange={(ev) => updateEx(i, 'notes', ev.target.value)}
          />
        </div>
      ))}
      <button
        className="btn secondary small"
        onClick={() =>
          setExercises((p) => [...p, { name: '', sets: '', reps: '', weight: '', notes: '' }])
        }
      >
        + Esercizio
      </button>
      <div className="section-gap" />
      <div className="btn-row">
        <button className="btn secondary" onClick={onCancel}>Annulla</button>
        <button className="btn" onClick={save}>Salva</button>
      </div>
    </div>
  )
}

function PlanEditor({ plan, onSave, onCancel }) {
  const [name, setName] = useState(plan.name)
  const [days, setDays] = useState(() =>
    [1, 2, 3, 4, 5, 6, 7].map((wd) => {
      const d = plan.days.find((x) => x.weekday === wd)
      return d
        ? { ...d, exercises: d.exercises.map((e) => ({ ...e })) }
        : { weekday: wd, title: '', sport: 'weights', exercises: [] }
    }),
  )

  function updateDay(wd, patch) {
    setDays((prev) => prev.map((d) => (d.weekday === wd ? { ...d, ...patch } : d)))
  }

  function updateEx(wd, i, field, value) {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === wd
          ? { ...d, exercises: d.exercises.map((e, j) => (j === i ? { ...e, [field]: value } : e)) }
          : d,
      ),
    )
  }

  function addEx(wd) {
    updateDay(wd, {
      exercises: [
        ...days.find((d) => d.weekday === wd).exercises,
        { name: '', sets: '', reps: '', weight: '', notes: '' },
      ],
    })
  }

  function removeEx(wd, i) {
    updateDay(wd, {
      exercises: days.find((d) => d.weekday === wd).exercises.filter((_, j) => j !== i),
    })
  }

  function save() {
    const cleanDays = days
      .map((d) => ({
        ...d,
        title: d.title.trim() || 'Workout',
        exercises: d.exercises.filter((e) => e.name.trim()),
      }))
      .filter((d) => d.exercises.length > 0)
    onSave({ ...plan, name: name.trim() || 'Piano di allenamento', days: cleanDays })
  }

  return (
    <SystemWindow title="Modifica piano">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome del piano" />
      <div className="section-gap" />
      {days.map((d) => (
        <div key={d.weekday} className="day-card">
          <div className="day-name">{WEEKDAY_NAMES[d.weekday - 1]}</div>
          <input
            type="text"
            placeholder="Titolo workout (vuoto = riposo)"
            value={d.title}
            onChange={(e) => updateDay(d.weekday, { title: e.target.value })}
            style={{ margin: '6px 0' }}
          />
          {d.exercises.map((e, i) => (
            <div key={i} className="edit-ex-row">
              <input
                className="ex-name"
                type="text"
                placeholder="Esercizio"
                value={e.name}
                onChange={(ev) => updateEx(d.weekday, i, 'name', ev.target.value)}
              />
              <input
                className="ex-num"
                type="text"
                placeholder="Serie"
                value={e.sets}
                onChange={(ev) => updateEx(d.weekday, i, 'sets', ev.target.value)}
              />
              <input
                className="ex-num"
                type="text"
                placeholder="Rip."
                value={e.reps}
                onChange={(ev) => updateEx(d.weekday, i, 'reps', ev.target.value)}
              />
              <button className="remove-ex" onClick={() => removeEx(d.weekday, i)}>✕</button>
            </div>
          ))}
          <button className="btn secondary small" onClick={() => addEx(d.weekday)}>
            + Esercizio
          </button>
        </div>
      ))}
      <div className="btn-row">
        <button className="btn secondary" onClick={onCancel}>Annulla</button>
        <button className="btn" onClick={save}>Salva</button>
      </div>
    </SystemWindow>
  )
}

// Un solo punto di caricamento: incolli un JSON e l'app capisce da sola se è
// una scheda settimanale o una lista di attività Strava.
function SmartLoad({ data, setData }) {
  const [open, setOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState(null)
  const [planPreview, setPlanPreview] = useState(null)
  const [stravaPreview, setStravaPreview] = useState(null)
  const [message, setMessage] = useState(null)
  // default: la scheda nuova vale dal prossimo lunedì
  const [startInput, setStartInput] = useState(() => toKey(weekStart(addDays(new Date(), 7))))

  function reset() {
    setPasted('')
    setError(null)
    setPlanPreview(null)
    setStravaPreview(null)
    setStartInput(toKey(weekStart(addDays(new Date(), 7))))
  }

  function analyze(text = pasted) {
    setMessage(null)
    const { plan, error: planErr } = parsePlan(text)
    if (plan) {
      setPlanPreview(plan)
      setStravaPreview(null)
      setError(null)
      return
    }
    const { activities } = parseStravaActivities(text)
    if (activities) {
      setStravaPreview(activities)
      setPlanPreview(null)
      setError(null)
      return
    }
    setError(planErr)
  }

  // Legge la clipboard e analizza subito: un tap invece di tenere premuto
  // nella textarea. iOS chiede conferma con il popup "Incolla".
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text?.trim()) {
        setError('Gli appunti sono vuoti: copia prima la scheda.')
        return
      }
      setPasted(text)
      analyze(text)
    } catch {
      setError('Non riesco a leggere gli appunti: incolla a mano nella casella qui sotto.')
    }
  }

  function confirm() {
    if (planPreview) {
      // qualunque giorno scelga, il piano parte dal lunedì di quella settimana
      const startDate = toKey(weekStart(new Date(startInput + 'T12:00:00')))
      const newPlan = { ...planPreview, id: newId(), createdAt: todayKey(), startDate }
      setData({ ...data, plans: [...data.plans, newPlan] })
      setMessage(
        startDate > todayKey()
          ? `✓ Scheda «${planPreview.name}» caricata: parte ${formatKey(startDate).toLowerCase()}.`
          : `✓ Scheda «${planPreview.name}» caricata e attiva.`,
      )
    } else if (stravaPreview) {
      const { logs, added, skipped, xpGained } = mergeStravaActivities(data.logs, stravaPreview)
      const { profile } = applyXp(data.profile, xpGained)
      setData({ ...data, logs, profile })
      setMessage(
        `✓ ${added} allenamenti importati (+${xpGained} XP)` +
          (skipped > 0 ? `, ${skipped} già presenti saltati.` : '.'),
      )
    }
    reset()
    setOpen(false)
  }

  return (
    <SystemWindow title="Carica scheda">
      {message && <p className="hint" style={{ color: 'var(--success)' }}>{message}</p>}
      {!open ? (
        <>
          <p className="hint">
            Incolla qui la scheda settimanale fatta da Claude o i tuoi allenamenti Strava:
            l'app riconosce da sola cosa hai incollato.
          </p>
          <button className="btn" onClick={() => { setOpen(true); setMessage(null) }}>
            Incolla e carica
          </button>
        </>
      ) : (
        <div className="import-area">
          <button className="btn" onClick={pasteFromClipboard}>
            📋 Incolla dagli appunti
          </button>
          <div className="section-gap" />
          <p className="hint">…oppure incolla a mano:</p>
          <textarea
            placeholder="Incolla qui…"
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value)
              setError(null)
              setPlanPreview(null)
              setStravaPreview(null)
            }}
          />
          {error && <p className="parse-error">⚠ {error}</p>}
          {planPreview && (
            <>
              <p className="hint">Scheda settimanale — «{planPreview.name}»:</p>
              <PlanDays days={planPreview.days} />
              <div className="section-gap" />
              <p className="hint">📅 Da quando vale questa scheda? (parte dal lunedì di quella settimana)</p>
              <input
                type="date"
                value={startInput}
                onChange={(e) => e.target.value && setStartInput(e.target.value)}
              />
            </>
          )}
          {stravaPreview && (
            <p className="hint">
              Trovate <b>{stravaPreview.length}</b> attività Strava
              ({stravaPreview[stravaPreview.length - 1]?.date} → {stravaPreview[0]?.date}).
              I duplicati verranno saltati.
            </p>
          )}
          <div className="section-gap" />
          <div className="btn-row">
            <button className="btn secondary" onClick={() => { reset(); setOpen(false) }}>
              Annulla
            </button>
            {planPreview || stravaPreview ? (
              <button className="btn" onClick={confirm}>Conferma</button>
            ) : (
              <button className="btn" onClick={analyze}>Analizza</button>
            )}
          </div>
        </div>
      )}
    </SystemWindow>
  )
}

export default function Plans({ data, setData }) {
  const plan = activePlan(data)
  const [editing, setEditing] = useState(false)
  const [editingWd, setEditingWd] = useState(null)
  const today = todayKey()
  const upcoming = data.plans.filter((p) => p.startDate && p.startDate > today)
  const archived = data.plans.filter((p) => p !== plan && !upcoming.includes(p))

  function saveEdited(edited) {
    setData({
      ...data,
      plans: data.plans.map((p) => (p.id === edited.id ? edited : p)),
    })
    setEditing(false)
  }

  function activateOld(id) {
    const p = data.plans.find((x) => x.id === id)
    // riparte da questa settimana, così vince su eventuali piani datati
    const reactivated = { ...p, startDate: toKey(weekStart(new Date())) }
    setData({ ...data, plans: [...data.plans.filter((x) => x.id !== id), reactivated] })
  }

  // Sposta (o scambia) un giorno del piano attivo su un altro weekday: cambio
  // permanente del piano, tutte le schermate derivano da qui.
  function moveDay(from, to) {
    const src = plan.days.find((d) => d.weekday === from && d.exercises.length > 0)
    if (!src) return
    const dst = plan.days.find((d) => d.weekday === to && d.exercises.length > 0)
    if (
      dst &&
      !window.confirm(`${WEEKDAY_NAMES[to - 1]} ha già «${dst.title}»: scambiare i due allenamenti?`)
    )
      return
    const days = plan.days.map((d) => {
      if (d === src) return { ...d, weekday: to }
      if (d === dst) return { ...d, weekday: from }
      return d
    })
    setData({ ...data, plans: data.plans.map((p) => (p.id === plan.id ? { ...plan, days } : p)) })
  }

  // Salva la modifica di un singolo giorno del piano attivo: senza esercizi
  // il giorno torna riposo.
  function saveDay(day) {
    const others = plan.days.filter((d) => d.weekday !== day.weekday)
    const days = day.exercises.length > 0 ? [...others, day] : others
    setData({ ...data, plans: data.plans.map((p) => (p.id === plan.id ? { ...plan, days } : p)) })
    setEditingWd(null)
  }

  function deletePlan(id) {
    if (!window.confirm('Eliminare questo piano? I workout già registrati restano nello storico.')) return
    setData({ ...data, plans: data.plans.filter((x) => x.id !== id) })
  }

  if (editing && plan) {
    return <PlanEditor plan={plan} onSave={saveEdited} onCancel={() => setEditing(false)} />
  }

  return (
    <div className="view">
      <SmartLoad data={data} setData={setData} />

      {plan ? (
        <SystemWindow title="Piano attivo">
          <p className="quest-title">{plan.name}</p>
          <p className="hint">Trascina un allenamento dalla maniglia ⠿ per spostarlo su un altro giorno.</p>
          <PlanDays
            days={plan.days}
            onMove={moveDay}
            editingWd={editingWd}
            onEditDay={setEditingWd}
            onSaveDay={saveDay}
            onCancelEdit={() => setEditingWd(null)}
          />
          <button className="btn secondary" onClick={() => setEditing(true)}>
            Modifica piano
          </button>
        </SystemWindow>
      ) : (
        <SystemWindow title="Piano attivo">
          <p className="empty-note">Nessun piano. Caricane uno qui sopra.</p>
        </SystemWindow>
      )}

      <MissionManager data={data} setData={setData} />

      {upcoming.length > 0 && (
        <SystemWindow title="In programma">
          {upcoming.map((p) => (
            <div key={p.id} className="log-card">
              <div className="log-date">parte {formatKey(p.startDate).toLowerCase()}</div>
              <div className="log-title">{p.name}</div>
              <PlanDays days={p.days} />
              <div className="section-gap" />
              <button className="btn danger small" onClick={() => deletePlan(p.id)}>
                Elimina
              </button>
            </div>
          ))}
        </SystemWindow>
      )}

      {archived.length > 0 && (
        <SystemWindow title="Archivio piani">
          {archived
            .slice()
            .reverse()
            .map((p) => (
              <div key={p.id} className="log-card">
                <div className="log-date">{p.createdAt}</div>
                <div className="log-title">{p.name}</div>
                <div className="section-gap" />
                <div className="btn-row">
                  <button className="btn secondary small" onClick={() => activateOld(p.id)}>
                    Riattiva
                  </button>
                  <button className="btn danger small" onClick={() => deletePlan(p.id)}>
                    Elimina
                  </button>
                </div>
              </div>
            ))}
        </SystemWindow>
      )}
    </div>
  )
}
