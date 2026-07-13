import { useState } from 'react'
import SystemWindow from './SystemWindow.jsx'
import { newId } from '../logic/ids.js'
import { formatKey, todayKey } from '../logic/dates.js'

const DOW_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export function scheduleLabel(q) {
  const parts = []
  if (q.until && q.until === q.since) return `Solo ${formatKey(q.since).toLowerCase()}`
  if (q.everyN === 2) parts.push('Un giorno sì e uno no')
  else if (q.everyN) parts.push(`Ogni ${q.everyN} giorni`)
  else if (q.days && q.days.length < 7) parts.push(q.days.map((d) => DOW_SHORT[d - 1]).join(', '))
  else parts.push('Ogni giorno')
  if (q.until) parts.push(`fino al ${formatKey(q.until).toLowerCase()}`)
  return parts.join(' · ')
}

function freqOf(q) {
  if (q.everyN === 2) return 'alt'
  if (q.days && q.days.length < 7) return 'days'
  return 'daily'
}

function durationOf(q) {
  if (q.until && q.until === q.since) return 'once'
  if (q.until) return 'until'
  return 'forever'
}

function MissionForm({ quest, onSave, onCancel }) {
  const isNew = !quest.label
  const [label, setLabel] = useState(quest.label || '')
  const [freq, setFreq] = useState(freqOf(quest))
  const [days, setDays] = useState(quest.days || [1, 2, 3, 4, 5])
  const [duration, setDuration] = useState(durationOf(quest))
  const [until, setUntil] = useState(quest.until || todayKey())
  const [onceDay, setOnceDay] = useState(
    quest.until && quest.until === quest.since ? quest.since : todayKey(),
  )

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  function save() {
    const name = label.trim()
    if (!name) return
    const q = { id: quest.id || newId(), label: name, since: quest.since || todayKey() }
    if (freq === 'days') q.days = days
    if (freq === 'alt') q.everyN = 2
    if (duration === 'until') q.until = until
    if (duration === 'once') {
      q.since = onceDay
      q.until = onceDay
    }
    onSave(q)
  }

  return (
    <div className="mission-form">
      <div className="free-title-input">
        <input
          type="text"
          placeholder="Es. 20 piegamenti"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <p className="quest-goal-label">FREQUENZA</p>
      <div className="sport-chips">
        <button className={'sport-chip' + (freq === 'daily' ? ' on' : '')} onClick={() => setFreq('daily')}>
          Ogni giorno
        </button>
        <button className={'sport-chip' + (freq === 'days' ? ' on' : '')} onClick={() => setFreq('days')}>
          Giorni della settimana
        </button>
        <button className={'sport-chip' + (freq === 'alt' ? ' on' : '')} onClick={() => setFreq('alt')}>
          Un giorno sì e uno no
        </button>
      </div>
      {freq === 'days' && (
        <div className="sport-chips day-toggles">
          {DOW_SHORT.map((name, i) => (
            <button
              key={i}
              className={'sport-chip' + (days.includes(i + 1) ? ' on' : '')}
              onClick={() => toggleDay(i + 1)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <p className="quest-goal-label" style={{ marginTop: 10 }}>DURATA</p>
      <div className="sport-chips">
        <button
          className={'sport-chip' + (duration === 'forever' ? ' on' : '')}
          onClick={() => setDuration('forever')}
        >
          Per sempre
        </button>
        <button
          className={'sport-chip' + (duration === 'until' ? ' on' : '')}
          onClick={() => setDuration('until')}
        >
          Fino al…
        </button>
        <button
          className={'sport-chip' + (duration === 'once' ? ' on' : '')}
          onClick={() => setDuration('once')}
        >
          Solo un giorno
        </button>
      </div>
      {duration === 'until' && (
        <div className="free-title-input">
          <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      )}
      {duration === 'once' && (
        <div className="free-title-input">
          <input type="date" value={onceDay} onChange={(e) => setOnceDay(e.target.value)} />
        </div>
      )}

      <div className="section-gap" />
      <div className="btn-row">
        <button className="btn secondary" onClick={onCancel}>Annulla</button>
        <button className="btn" onClick={save} disabled={!label.trim() || (freq === 'days' && days.length === 0)}>
          {isNew ? 'Aggiungi' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

export default function MissionManager({ data, setData }) {
  const [editingId, setEditingId] = useState(null) // id | 'new' | null

  function saveQuest(q) {
    const exists = data.dailyQuests.some((x) => x.id === q.id)
    setData({
      ...data,
      dailyQuests: exists
        ? data.dailyQuests.map((x) => (x.id === q.id ? q : x))
        : [...data.dailyQuests, q],
    })
    setEditingId(null)
  }

  function deleteQuest(q) {
    if (!window.confirm(`Eliminare «${q.label}»? Sparirà anche dai giorni passati. Per interromperla e basta, usa "Fino al…".`)) return
    setData({ ...data, dailyQuests: data.dailyQuests.filter((x) => x.id !== q.id) })
  }

  return (
    <SystemWindow title="Missioni giornaliere">
      {data.dailyQuests.length === 0 && editingId !== 'new' && (
        <p className="empty-note">Nessuna missione. Aggiungine una: +10 XP quando la completi, −10 se la salti.</p>
      )}
      {data.dailyQuests.map((q) =>
        editingId === q.id ? (
          <MissionForm key={q.id} quest={q} onSave={saveQuest} onCancel={() => setEditingId(null)} />
        ) : (
          <div key={q.id} className="mission-manage-row">
            <div className="exercise-info">
              <div className="exercise-name">{q.label}</div>
              <div className="mission-schedule">{scheduleLabel(q)}</div>
            </div>
            <div className="log-actions">
              <button className="link-btn" onClick={() => setEditingId(q.id)}>modifica</button>
              <button className="link-btn danger" onClick={() => deleteQuest(q)}>elimina</button>
            </div>
          </div>
        ),
      )}
      {editingId === 'new' ? (
        <MissionForm quest={{}} onSave={saveQuest} onCancel={() => setEditingId(null)} />
      ) : (
        !editingId && (
          <>
            <div className="section-gap" />
            <button className="btn secondary small" onClick={() => setEditingId('new')}>
              + Missione
            </button>
          </>
        )
      )}
    </SystemWindow>
  )
}
