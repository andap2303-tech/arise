import SystemWindow from './SystemWindow.jsx'
import SportBadge from './SportBadge.jsx'
import { formatKey, fromKey, isoWeekday, todayKey } from '../logic/dates.js'

export function exerciseDetail(e) {
  const parts = []
  if (e.sets && e.reps) parts.push(`${e.sets} × ${e.reps}`)
  else if (e.reps) parts.push(String(e.reps))
  if (e.weight) parts.push(String(e.weight))
  if (e.notes) parts.push(e.notes)
  return parts.join(' · ')
}

// Le missioni giornaliere esistono da quando esiste l'app: prima di questa
// data non ha senso mostrarle (né fatte né saltate).
const MISSIONS_SINCE = '2026-07-09'

function DayMissions({ dayKey, quests, ticks, isPast }) {
  if (dayKey < MISSIONS_SINCE || quests.length === 0) return null
  const ticked = new Set(ticks[dayKey] || [])
  return (
    <>
      <p className="quest-goal-label" style={{ marginTop: 14 }}>MISSIONI GIORNALIERE</p>
      {quests.map((q) => {
        const done = ticked.has(q.id)
        const missed = isPast && !done
        return (
          <div key={q.id} className={'exercise-row mission-row' + (done ? ' done' : '')}>
            <span className={'check' + (done ? ' success' : missed ? ' missed' : '')}>
              {missed ? '✕' : '✓'}
            </span>
            <div className="exercise-info">
              <div className="exercise-name" style={missed ? { color: 'var(--danger)' } : undefined}>
                {q.label}
              </div>
            </div>
            <span className="mission-xp">{done ? '+10 XP' : missed ? 'saltata' : ''}</span>
          </div>
        )
      })}
    </>
  )
}

export default function DayDetail({ dayKey, logs, plan, quests, ticks }) {
  const today = todayKey()
  const dayLogs = logs.filter((l) => l.date === dayKey)
  const wd = isoWeekday(fromKey(dayKey))
  const planDay = plan?.days.find((d) => d.weekday === wd && d.exercises.length > 0)
  const isPast = dayKey < today

  return (
    <SystemWindow title={formatKey(dayKey)}>
      {dayLogs.length > 0 ? (
        dayLogs.map((l) => (
          <div key={l.id}>
            <SportBadge sport={l.sport} workoutType={l.workoutType} center />
            <p className="quest-title">{l.title}</p>
            {l.description && <p className="log-description">{l.description}</p>}
            {l.exercises.map((e, i) => (
              <div key={i} className={'exercise-row' + (e.done ? ' done' : '')}>
                <span className={'check' + (e.done ? ' on' : '')}>✓</span>
                <div className="exercise-info">
                  <div className="exercise-name">{e.name}</div>
                  <div className="exercise-detail">{exerciseDetail(e)}</div>
                </div>
              </div>
            ))}
            <p className="quest-warning">+{l.xpEarned} XP</p>
          </div>
        ))
      ) : isPast ? (
        <p className="empty-note">Nessun allenamento registrato.</p>
      ) : planDay ? (
        <>
          <p className="quest-goal-label">IN PROGRAMMA</p>
          <p className="quest-title">{planDay.title}</p>
          {planDay.exercises.map((e, i) => (
            <div key={i} className="exercise-row">
              <span className="check">✓</span>
              <div className="exercise-info">
                <div className="exercise-name">{e.name}</div>
                <div className="exercise-detail">{exerciseDetail(e)}</div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="empty-note">Nessun allenamento in programma — riposo.</p>
      )}
      <DayMissions dayKey={dayKey} quests={quests} ticks={ticks} isPast={isPast} />
    </SystemWindow>
  )
}
