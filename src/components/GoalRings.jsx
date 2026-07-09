import { useState } from 'react'
import SystemWindow from './SystemWindow.jsx'
import { GOAL_TYPES, goalProgress } from '../logic/goals.js'
import { SPORTS } from '../logic/sports.js'
import { newId } from '../logic/ids.js'

function GoalEditor({ goals, onSave, onCancel }) {
  const [rows, setRows] = useState(goals.map((g) => ({ ...g })))

  const update = (i, patch) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  function save() {
    const clean = rows
      .filter((r) => Number(r.target) > 0)
      .map((r) => ({ ...r, target: Number(r.target), label: r.label.trim() }))
    onSave(clean)
  }

  return (
    <SystemWindow title="Obiettivi settimana">
      {rows.map((g, i) => (
        <div key={g.id} className="goal-edit-row">
          <input
            type="text"
            placeholder="Nome"
            value={g.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <select value={g.type} onChange={(e) => update(i, { type: e.target.value, sport: e.target.value === 'sport' ? g.sport || 'tennis' : undefined })}>
            {Object.entries(GOAL_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {g.type === 'sport' && (
            <select value={g.sport} onChange={(e) => update(i, { sport: e.target.value })}>
              {Object.entries(SPORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          )}
          <div className="goal-edit-target">
            <input
              type="number"
              min="1"
              value={g.target}
              onChange={(e) => update(i, { target: e.target.value })}
            />
            <button className="remove-ex" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>✕</button>
          </div>
        </div>
      ))}
      <button
        className="btn secondary small"
        onClick={() => setRows((p) => [...p, { id: newId(), label: '', type: 'workouts', target: 3 }])}
      >
        + Obiettivo
      </button>
      <div className="section-gap" />
      <div className="btn-row">
        <button className="btn secondary" onClick={onCancel}>Annulla</button>
        <button className="btn" onClick={save}>Salva</button>
      </div>
    </SystemWindow>
  )
}

const R = 26
const CIRC = 2 * Math.PI * R

function Ring({ progress }) {
  const frac = Math.min(progress.current / progress.target, 1)
  const grad = progress.done ? 'ring-grad-gold' : 'ring-grad-blue'
  // cifre arrotondate: "12/10" invece di "12.1/10", così non sbordano mai
  const current = Math.round(progress.current)
  return (
    <div className={'goal-ring' + (progress.done ? ' done' : '')}>
      <div className="goal-ring-svg">
        <svg viewBox="0 0 64 64" width="76" height="76">
          <defs>
            <linearGradient id="ring-grad-blue" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#0077ff" />
              <stop offset="100%" stopColor="#00e0ff" />
            </linearGradient>
            <linearGradient id="ring-grad-gold" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#ffd76a" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(74,168,255,0.14)" strokeWidth="5.5" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke={`url(#${grad})`}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={`${CIRC * frac} ${CIRC}`}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <span className="goal-ring-value">
          {current}
          <small>/{progress.target}</small>
        </span>
      </div>
      <span className="goal-ring-label">
        {progress.label}
        {progress.unit ? ` · ${progress.unit.trim()}` : ''}
      </span>
    </div>
  )
}

// Riga compatta di anelli: volutamente discreta, senza SystemWindow.
export default function GoalRings({ data, setData }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <GoalEditor
        goals={data.goals}
        onSave={(goals) => {
          setData({ ...data, goals })
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  if (data.goals.length === 0) {
    return (
      <div className="goal-rings">
        <button className="goal-edit-btn" onClick={() => setEditing(true)}>+ obiettivi</button>
      </div>
    )
  }

  return (
    <div className="goal-rings">
      {data.goals.map((g) => (
        <Ring key={g.id} progress={goalProgress(g, data.logs)} />
      ))}
      <button className="goal-edit-btn rings" onClick={() => setEditing(true)}>✎</button>
    </div>
  )
}
