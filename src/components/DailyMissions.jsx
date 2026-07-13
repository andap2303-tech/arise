import SystemWindow from './SystemWindow.jsx'
import { applyXp, removeXp } from '../logic/xp.js'
import { todayKey } from '../logic/dates.js'
import { questsForDay } from '../logic/penalties.js'

const XP_PER_MISSION = 10

export default function DailyMissions({ data, setData, onGoToPlans }) {
  const today = todayKey()
  const quests = questsForDay(data.dailyQuests, today)
  const ticked = new Set(data.dailyTicks[today] || [])
  const allDone = quests.length > 0 && quests.every((q) => ticked.has(q.id))

  function toggle(id) {
    const next = new Set(ticked)
    let profile = data.profile
    if (next.has(id)) {
      next.delete(id)
      profile = removeXp(profile, XP_PER_MISSION)
    } else {
      next.add(id)
      profile = applyXp(profile, XP_PER_MISSION).profile
    }
    setData({
      ...data,
      profile,
      dailyTicks: { ...data.dailyTicks, [today]: [...next] },
    })
  }

  if (data.dailyQuests.length === 0) return null

  return (
    <SystemWindow title="Missioni giornaliere">
      {quests.length === 0 && <p className="empty-note">Nessuna missione oggi.</p>}
      {quests.map((q) => {
        const done = ticked.has(q.id)
        return (
          <div key={q.id} className={'exercise-row mission-row' + (done ? ' done' : '')}>
            <button className={'check' + (done ? ' on' : '')} onClick={() => toggle(q.id)}>
              ✓
            </button>
            <div className="exercise-info" onClick={() => toggle(q.id)}>
              <div className="exercise-name">{q.label}</div>
            </div>
            <span className="mission-xp">{done ? `+${XP_PER_MISSION} XP` : ''}</span>
          </div>
        )
      })}
      {allDone && <p className="missions-done">✦ Missioni completate, Hunter.</p>}
      <button className="goal-edit-btn" onClick={onGoToPlans}>✎ gestisci in Piani</button>
    </SystemWindow>
  )
}
