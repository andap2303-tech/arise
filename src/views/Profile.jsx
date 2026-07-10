import { useRef } from 'react'
import SystemWindow from '../components/SystemWindow.jsx'
import { activePlan } from '../store.js'
import { rankForLevel, xpForNextLevel } from '../logic/xp.js'
import { computeWeekStreak } from '../logic/streak.js'
import { todayKey, toKey, weekStart } from '../logic/dates.js'

export default function Profile({ data, setData }) {
  const fileRef = useRef(null)
  const { level, xp } = data.profile
  const rank = rankForLevel(level)
  const needed = xpForNextLevel(level)
  const weekStreak = computeWeekStreak(data.logs, data.profile.weekStreak)

  const now = new Date()
  const monthPrefix = todayKey().slice(0, 7)
  const wkStart = toKey(weekStart(now))
  const monthCount = data.logs.filter((l) => l.date.startsWith(monthPrefix)).length
  const weekCount = data.logs.filter((l) => l.date >= wkStart && l.date <= todayKey()).length

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arise-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(ev) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!parsed.profile || !Array.isArray(parsed.logs) || !Array.isArray(parsed.plans)) {
          throw new Error('formato non riconosciuto')
        }
        if (
          window.confirm(
            `Ripristinare il backup? Sostituirà TUTTI i dati attuali (${parsed.logs.length} workout nel backup).`,
          )
        ) {
          setData(parsed)
        }
      } catch (e) {
        window.alert('File di backup non valido: ' + e.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="view">
      <SystemWindow title="Status" variant={rank.rank === 'S' ? 'purple' : undefined}>
        <div className="level-row">
          <div>
            <div className="level-num">{level}</div>
            <div className="level-label">Livello</div>
          </div>
          <div>
            <div className="rank-badge" style={{ color: rank.color }}>{rank.rank}</div>
            <div className="level-label" style={{ marginTop: 4 }}>Rank</div>
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${Math.min((xp / needed) * 100, 100)}%` }} />
        </div>
        <div className="xp-bar-text">
          {xp} / {needed} XP per il livello {level + 1}
        </div>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-value">🔥 {weekStreak}</div>
            <div className="stat-label">Settimane di fila</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{data.logs.length}</div>
            <div className="stat-label">Workout totali</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weekCount}</div>
            <div className="stat-label">Questa settimana</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{monthCount}</div>
            <div className="stat-label">Questo mese</div>
          </div>
        </div>
      </SystemWindow>

      <div className="backup-row">
        I dati vivono solo su questo dispositivo —{' '}
        <button className="link-btn" onClick={exportBackup}>salva backup</button>
        {' · '}
        <button className="link-btn" onClick={() => fileRef.current?.click()}>ripristina</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={importBackup}
        />
      </div>
    </div>
  )
}
