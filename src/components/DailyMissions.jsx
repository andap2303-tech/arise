import { useState } from 'react'
import SystemWindow from './SystemWindow.jsx'
import { newId } from '../logic/ids.js'
import { applyXp, removeXp } from '../logic/xp.js'
import { todayKey } from '../logic/dates.js'

const XP_PER_MISSION = 10

function MissionEditor({ quests, onSave, onCancel }) {
  const [rows, setRows] = useState(quests.map((q) => ({ ...q })))

  function save() {
    onSave(rows.map((r) => ({ ...r, label: r.label.trim() })).filter((r) => r.label))
  }

  return (
    <>
      {rows.map((q, i) => (
        <div key={q.id} className="edit-ex-row">
          <input
            className="ex-name"
            type="text"
            placeholder="Es. 20 piegamenti"
            value={q.label}
            onChange={(e) =>
              setRows((prev) => prev.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
            }
          />
          <button className="remove-ex" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button
        className="btn secondary small"
        onClick={() => setRows((p) => [...p, { id: newId(), label: '' }])}
      >
        + Missione
      </button>
      <div className="section-gap" />
      <div className="btn-row">
        <button className="btn secondary" onClick={onCancel}>Annulla</button>
        <button className="btn" onClick={save}>Salva</button>
      </div>
    </>
  )
}

export default function DailyMissions({ data, setData }) {
  const [editing, setEditing] = useState(false)
  const today = todayKey()
  const ticked = new Set(data.dailyTicks[today] || [])
  const allDone = data.dailyQuests.length > 0 && data.dailyQuests.every((q) => ticked.has(q.id))

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

  if (data.dailyQuests.length === 0 && !editing) return null

  return (
    <SystemWindow title="Missioni giornaliere">
      {editing ? (
        <MissionEditor
          quests={data.dailyQuests}
          onSave={(dailyQuests) => {
            setData({ ...data, dailyQuests })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          {data.dailyQuests.map((q) => {
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
          <button className="goal-edit-btn" onClick={() => setEditing(true)}>✎ modifica</button>
        </>
      )}
    </SystemWindow>
  )
}
