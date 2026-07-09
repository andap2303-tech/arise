import { useMemo, useState } from 'react'
import SystemWindow from '../components/SystemWindow.jsx'
import Calendar from '../components/Calendar.jsx'
import SportIcon from '../components/SportIcon.jsx'
import SportBadge from '../components/SportBadge.jsx'
import WorkoutTypeChips from '../components/WorkoutTypeChips.jsx'
import { formatKey, toKey, weekStart } from '../logic/dates.js'
import { removeXp } from '../logic/xp.js'
import { SPORTS } from '../logic/sports.js'

function LogCard({ log, onEdit, onDelete }) {
  return (
    <div className="log-card">
      <span className="log-xp">+{log.xpEarned} XP</span>
      <div className="log-date">{formatKey(log.date)}</div>
      <SportBadge sport={log.sport} workoutType={log.workoutType} />
      <div className="log-title">{log.title}</div>
      {log.description && <p className="log-description">{log.description}</p>}
      {log.exercises.length > 0 && (
        <ul>
          {log.exercises.map((e, i) => (
            <li key={i} className={e.done ? 'done' : ''}>
              {e.name}
              {e.sets && e.reps ? ` — ${e.sets} × ${e.reps}` : ''}
              {e.weight ? ` @ ${e.weight}` : ''}
              {!e.done && <span className="miss">saltato</span>}
            </li>
          ))}
        </ul>
      )}
      {onEdit && (
        <div className="log-actions">
          <button className="link-btn" onClick={onEdit}>modifica</button>
          <button className="link-btn danger" onClick={onDelete}>elimina</button>
        </div>
      )}
    </div>
  )
}

function LogEditor({ log, workoutTypes, onTypesChange, onSave, onCancel }) {
  const [title, setTitle] = useState(log.title)
  const [sport, setSport] = useState(log.sport || 'other')
  const [workoutType, setWorkoutType] = useState(log.workoutType || null)
  const [km, setKm] = useState(log.distanceKm ? String(log.distanceKm) : '')
  const [description, setDescription] = useState(log.description || '')
  const [exercises, setExercises] = useState(log.exercises.map((e) => ({ ...e })))

  const showKm = ['run', 'bike', 'swim'].includes(sport)

  function updateEx(i, field, value) {
    setExercises((prev) => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)))
  }

  function save() {
    const distanceKm = Number(String(km).replace(',', '.')) || undefined
    onSave({
      ...log,
      title: title.trim() || SPORTS[sport].label,
      sport,
      workoutType: workoutType || undefined,
      description: description.trim() || undefined,
      distanceKm: showKm ? distanceKm : log.distanceKm,
      exercises: exercises.filter((e) => String(e.name).trim()),
    })
  }

  return (
    <div className="log-card editing">
      <div className="log-date">{formatKey(log.date)}</div>
      <div className="sport-chips" style={{ margin: '8px 0' }}>
        {Object.entries(SPORTS).map(([key, s]) => (
          <button
            key={key}
            className={'sport-chip' + (sport === key ? ' on' : '')}
            onClick={() => {
              setSport(key)
              setWorkoutType(null)
            }}
          >
            <SportIcon sport={key} size={16} /> {s.label}
          </button>
        ))}
      </div>
      <WorkoutTypeChips
        types={workoutTypes[sport] || []}
        value={workoutType}
        onChange={setWorkoutType}
        onTypesChange={(types) => onTypesChange(sport, types)}
      />
      <div className="free-title-input">
        <input type="text" placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="free-title-input">
        <textarea
          rows="2"
          placeholder="Descrizione (opzionale)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {showKm && (
        <div className="free-title-input">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Distanza in km"
            value={km}
            onChange={(e) => setKm(e.target.value)}
          />
        </div>
      )}
      {exercises.map((e, i) => (
        <div key={i} className="edit-ex-row">
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
          <button className="remove-ex" onClick={() => setExercises((p) => p.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button
        className="btn secondary small"
        onClick={() => setExercises((p) => [...p, { name: '', sets: '', reps: '', done: true }])}
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

export default function History({ data, setData }) {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)

  const logsByDate = useMemo(() => {
    const m = new Map()
    for (const l of data.logs) if (!m.has(l.date)) m.set(l.date, l)
    return m
  }, [data.logs])

  const now = new Date()
  const monthPrefix = toKey(now).slice(0, 7)
  const wkStart = toKey(weekStart(now))
  const counts = {
    total: data.logs.length,
    month: data.logs.filter((l) => l.date.startsWith(monthPrefix)).length,
    week: data.logs.filter((l) => l.date >= wkStart && l.date <= toKey(now)).length,
  }

  const selectedLogs = selected ? data.logs.filter((l) => l.date === selected) : []

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return data.logs
      .filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.exercises.some((e) => e.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [query, data.logs])

  function saveLog(edited) {
    setData({ ...data, logs: data.logs.map((l) => (l.id === edited.id ? edited : l)) })
    setEditingId(null)
  }

  function deleteLog(log) {
    if (!window.confirm(`Eliminare "${log.title}" del ${formatKey(log.date)}? Gli XP guadagnati verranno tolti.`)) return
    setData({
      ...data,
      logs: data.logs.filter((l) => l.id !== log.id),
      profile: removeXp(data.profile, log.xpEarned || 0),
    })
  }

  return (
    <div className="view">
      <SystemWindow title="Registro Hunter">
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
          <div className="stat-box">
            <div className="stat-value">{counts.total}</div>
            <div className="stat-label">Totali</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{counts.month}</div>
            <div className="stat-label">Mese</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{counts.week}</div>
            <div className="stat-label">Settimana</div>
          </div>
        </div>
        <Calendar
          logsByDate={logsByDate}
          selected={selected}
          onSelect={(k) => {
            setSelected(k === selected ? null : k)
            setEditingId(null)
          }}
        />
      </SystemWindow>

      {selected && (
        <SystemWindow title={formatKey(selected)}>
          {selectedLogs.length > 0 ? (
            selectedLogs.map((l) =>
              editingId === l.id ? (
                <LogEditor
                  key={l.id}
                  log={l}
                  workoutTypes={data.workoutTypes}
                  onTypesChange={(sport, types) =>
                    setData({ ...data, workoutTypes: { ...data.workoutTypes, [sport]: types } })
                  }
                  onSave={saveLog}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <LogCard
                  key={l.id}
                  log={l}
                  onEdit={() => setEditingId(l.id)}
                  onDelete={() => deleteLog(l)}
                />
              ),
            )
          ) : (
            <p className="empty-note">Nessun allenamento registrato.</p>
          )}
        </SystemWindow>
      )}

      <SystemWindow title="Ricerca">
        <input
          type="search"
          placeholder="Cerca per titolo o esercizio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="section-gap" />
        {query.trim() &&
          (results.length > 0 ? (
            results.map((l) => <LogCard key={l.id} log={l} />)
          ) : (
            <p className="empty-note">Nessun risultato.</p>
          ))}
      </SystemWindow>
    </div>
  )
}
