import { useState } from 'react'
import SystemWindow from '../components/SystemWindow.jsx'
import QuestPopup from '../components/QuestPopup.jsx'
import WeekStrip from '../components/WeekStrip.jsx'
import GoalRings from '../components/GoalRings.jsx'
import DailyMissions from '../components/DailyMissions.jsx'
import SportIcon from '../components/SportIcon.jsx'
import SportBadge from '../components/SportBadge.jsx'
import WorkoutTypeChips from '../components/WorkoutTypeChips.jsx'
import DayDetail, { exerciseDetail } from '../components/DayDetail.jsx'
import { activePlan } from '../store.js'
import { plannedDayForDate } from '../logic/plans.js'
import { newId } from '../logic/ids.js'
import { addDays, formatKey, todayKey, toKey } from '../logic/dates.js'
import { XP_PER_WORKOUT, applyXp, streakBonus } from '../logic/xp.js'
import { computeStreak, computeWeekStreak } from '../logic/streak.js'
import { SPORTS } from '../logic/sports.js'

function StreakChip({ weeks }) {
  return (
    <div className="streak-chip">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2c.5 3.5-1 5-2.5 6.8C8 10.5 7 12.2 7 14.5A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5c0-1.6-.6-2.9-1.4-4.1-.3 1-1 1.9-1.9 2.3.3-2.6-.5-6.4-1.7-8.7z" />
      </svg>
      <span className="streak-num">{weeks}</span>
      <span className="streak-label">settimane</span>
    </div>
  )
}

export default function Today({ data, setData }) {
  const today = todayKey()
  const plan = activePlan(data)
  const planDay = plannedDayForDate(data, today)
  const postponedTo = data.moves?.[today]
  const todayLog = data.logs.find((l) => l.date === today)
  const weekStreak = computeWeekStreak(data.logs, data.profile.weekStreak)

  const [checked, setChecked] = useState(new Set())
  const [selectedDay, setSelectedDay] = useState(null)
  const [popup, setPopup] = useState(null)
  const [freeMode, setFreeMode] = useState(false)
  const [freeTitle, setFreeTitle] = useState('')
  const [freeSport, setFreeSport] = useState('weights')
  const [freeType, setFreeType] = useState(null)
  const [freeKm, setFreeKm] = useState('')
  const [freeDescription, setFreeDescription] = useState('')
  const [freeExercises, setFreeExercises] = useState([{ name: '', sets: '', reps: '' }])

  function toggle(i) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function completeWorkout(title, exercises, sport, distanceKm, workoutType, description) {
    const streak = computeStreak([...data.logs, { date: today }], plan)
    const bonus = streakBonus(streak)
    const xpEarned = XP_PER_WORKOUT + bonus
    const { profile, leveledUp, oldRank, newRank } = applyXp(data.profile, xpEarned)
    const log = {
      id: newId(),
      date: today,
      title,
      sport,
      distanceKm: distanceKm || undefined,
      workoutType: workoutType || undefined,
      description: description?.trim() || undefined,
      exercises,
      xpEarned,
      completedAt: new Date().toISOString(),
    }
    setData({ ...data, profile, logs: [...data.logs, log] })
    setPopup({
      xpEarned,
      bonus,
      streak,
      leveledUp,
      newLevel: profile.level,
      rankChanged: oldRank.rank !== newRank.rank,
      newRank,
    })
  }

  function postpone() {
    const tomorrow = toKey(addDays(new Date(), 1))
    const tomorrowOwn = plannedDayForDate(data, tomorrow)
    const msg = tomorrowOwn
      ? `Domani c'è già «${tomorrowOwn.title}»: verrebbe coperto da «${planDay.title}». Posticipare lo stesso?`
      : `Spostare «${planDay.title}» a domani? Oggi diventa riposo, senza penalità.`
    if (!window.confirm(msg)) return
    setData({ ...data, moves: { ...data.moves, [today]: tomorrow } })
  }

  function undoPostpone() {
    const moves = { ...data.moves }
    delete moves[today]
    setData({ ...data, moves })
  }

  function completeQuest() {
    const exercises = planDay.exercises.map((e, i) => ({ ...e, done: checked.has(i) }))
    completeWorkout(planDay.title, exercises, planDay.sport || 'weights')
  }

  function completeFree() {
    const exercises = freeExercises
      .filter((e) => e.name.trim())
      .map((e) => ({ ...e, name: e.name.trim(), done: true }))
    const km = Number(String(freeKm).replace(',', '.')) || 0
    completeWorkout(
      freeTitle.trim() || freeType || SPORTS[freeSport].label,
      exercises,
      freeSport,
      km,
      freeType,
      freeDescription,
    )
    setFreeMode(false)
    setFreeTitle('')
    setFreeType(null)
    setFreeKm('')
    setFreeDescription('')
    setFreeExercises([{ name: '', sets: '', reps: '' }])
  }

  function updateFreeEx(i, field, value) {
    setFreeExercises((prev) => prev.map((e, j) => (j === i ? { ...e, [field]: value } : e)))
  }

  const showKmInput = ['run', 'bike', 'swim'].includes(freeSport)
  const viewingOtherDay = selectedDay && selectedDay !== today

  const header = (
    <>
      <div className="home-header">
        <h1 className="app-title-left">ARISE</h1>
        <StreakChip weeks={weekStreak} />
      </div>
      <p className="quest-goal-label">{formatKey(today)}</p>
      <WeekStrip
        data={data}
        logs={data.logs}
        selected={selectedDay}
        onSelect={(k) => setSelectedDay(k === selectedDay ? null : k)}
      />
    </>
  )

  // Guardando un altro giorno si vede solo il suo dettaglio: la Daily Quest
  // e le missioni riguardano il giorno corrente.
  if (viewingOtherDay) {
    return (
      <div className="view">
        {header}
        <DayDetail dayKey={selectedDay} data={data} />
      </div>
    )
  }

  return (
    <div className="view">
      {header}

      <GoalRings data={data} setData={setData} />

      {todayLog ? (
        <SystemWindow title="Quest completata">
          <SportBadge sport={todayLog.sport} workoutType={todayLog.workoutType} center />
          <p className="quest-title">{todayLog.title}</p>
          {todayLog.description && <p className="log-description">{todayLog.description}</p>}
          {todayLog.exercises.map((e, i) => (
            <div key={i} className={'exercise-row' + (e.done ? ' done' : '')}>
              <span className={'check' + (e.done ? ' on' : '')}>✓</span>
              <div className="exercise-info">
                <div className="exercise-name">{e.name}</div>
                <div className="exercise-detail">{exerciseDetail(e)}</div>
              </div>
            </div>
          ))}
          <p className="quest-warning">
            +{todayLog.xpEarned} XP — Torna domani, Hunter.
          </p>
        </SystemWindow>
      ) : planDay && !freeMode ? (
        <SystemWindow title="Daily Quest">
          <p className="quest-title">{planDay.title}</p>
          {planDay.exercises.map((e, i) => (
            <div key={i} className={'exercise-row' + (checked.has(i) ? ' done' : '')}>
              <button className={'check' + (checked.has(i) ? ' on' : '')} onClick={() => toggle(i)}>
                ✓
              </button>
              <div className="exercise-info" onClick={() => toggle(i)}>
                <div className="exercise-name">{e.name}</div>
                <div className="exercise-detail">{exerciseDetail(e)}</div>
              </div>
            </div>
          ))}
          <div className="section-gap" />
          <button className="btn" onClick={completeQuest} disabled={checked.size === 0}>
            Completa quest
          </button>
          <div className="section-gap" />
          <button className="btn secondary small" onClick={postpone}>
            ⏭ Posticipa a domani
          </button>
        </SystemWindow>
      ) : (
        <SystemWindow title={freeMode ? 'Registra allenamento' : 'Riposo'}>
          {!freeMode ? (
            <>
              <p className="quest-title">Nessuna quest oggi</p>
              {postponedTo ? (
                <>
                  <p className="quest-warning">
                    Allenamento posticipato a domani ({formatKey(postponedTo).toLowerCase()}).
                    Oggi niente penalità.
                  </p>
                  <div className="section-gap" />
                  <button className="btn secondary small" onClick={undoPostpone}>
                    ↩ Annulla posticipo
                  </button>
                </>
              ) : (
                <p className="quest-warning">Recupera le forze, Hunter.</p>
              )}
              <div className="section-gap" />
              <button className="btn secondary" onClick={() => setFreeMode(true)}>
                Registra un allenamento
              </button>
            </>
          ) : (
            <>
              <div className="sport-chips">
                {Object.entries(SPORTS).map(([key, s]) => (
                  <button
                    key={key}
                    className={'sport-chip' + (freeSport === key ? ' on' : '')}
                    onClick={() => {
                      setFreeSport(key)
                      setFreeType(null)
                    }}
                  >
                    <SportIcon sport={key} size={16} /> {s.label}
                  </button>
                ))}
              </div>
              <WorkoutTypeChips
                types={data.workoutTypes[freeSport] || []}
                value={freeType}
                onChange={setFreeType}
                onTypesChange={(types) =>
                  setData({ ...data, workoutTypes: { ...data.workoutTypes, [freeSport]: types } })
                }
              />
              <div className="free-title-input">
                <input
                  type="text"
                  placeholder={`Titolo (es. ${SPORTS[freeSport].label})`}
                  value={freeTitle}
                  onChange={(e) => setFreeTitle(e.target.value)}
                />
              </div>
              {showKmInput && (
                <div className="free-title-input">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Distanza in km (opzionale)"
                    value={freeKm}
                    onChange={(e) => setFreeKm(e.target.value)}
                  />
                </div>
              )}
              <div className="free-title-input">
                <textarea
                  rows="2"
                  placeholder="Descrizione (opzionale) — es. 10 min riscaldamento, poi..."
                  value={freeDescription}
                  onChange={(e) => setFreeDescription(e.target.value)}
                />
              </div>
              {freeExercises.map((e, i) => (
                <div key={i} className="edit-ex-row">
                  <input
                    className="ex-name"
                    type="text"
                    placeholder="Esercizio (opzionale)"
                    value={e.name}
                    onChange={(ev) => updateFreeEx(i, 'name', ev.target.value)}
                  />
                  <input
                    className="ex-num"
                    type="text"
                    placeholder="Serie"
                    value={e.sets}
                    onChange={(ev) => updateFreeEx(i, 'sets', ev.target.value)}
                  />
                  <input
                    className="ex-num"
                    type="text"
                    placeholder="Rip."
                    value={e.reps}
                    onChange={(ev) => updateFreeEx(i, 'reps', ev.target.value)}
                  />
                </div>
              ))}
              <button
                className="btn secondary small"
                onClick={() => setFreeExercises((p) => [...p, { name: '', sets: '', reps: '' }])}
              >
                + Esercizio
              </button>
              <div className="section-gap" />
              <div className="btn-row">
                <button className="btn secondary" onClick={() => setFreeMode(false)}>
                  Annulla
                </button>
                <button className="btn" onClick={completeFree}>
                  Completa
                </button>
              </div>
            </>
          )}
        </SystemWindow>
      )}

      <DailyMissions data={data} setData={setData} />

      {!todayLog && planDay && !freeMode && (
        <p className="hint" style={{ textAlign: 'center' }}>
          Hai fatto altro oggi?{' '}
          <a
            href="#"
            style={{ color: 'var(--glow-soft)' }}
            onClick={(e) => {
              e.preventDefault()
              setFreeMode(true)
            }}
          >
            Registralo qui
          </a>
        </p>
      )}

      <QuestPopup result={popup} onClose={() => setPopup(null)} />
    </div>
  )
}
