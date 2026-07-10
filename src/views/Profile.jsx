import { useRef, useState } from 'react'
import SystemWindow from '../components/SystemWindow.jsx'
import { activePlan } from '../store.js'
import { rankForLevel, xpForNextLevel } from '../logic/xp.js'
import { computeWeekStreak } from '../logic/streak.js'
import { addDays, fromKey, todayKey, toKey } from '../logic/dates.js'
import { PENALTY_SINCE, isMissedDay } from '../logic/penalties.js'

const VAPID_PUBLIC =
  'BAfA_UixDTpOkyC_4mO1Mz2qvFiAjeJ9lxjFIp6VLSa3LesKj1ItBxcABZg2ThPyoYjklVYsEQiPYyevRi8gp1E'

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// Attiva le push e restituisce la subscription in JSON: va consegnata (una
// volta sola) al mittente dei promemoria (GitHub Actions).
function NotificationSetup() {
  const [subJson, setSubJson] = useState(null)
  const [status, setStatus] = useState(null)

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  async function enable() {
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setStatus('Permesso negato: abilita le notifiche per ARISE nelle Impostazioni di iOS.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC),
        }))
      const json = JSON.stringify(sub.toJSON())
      setSubJson(json)
      try {
        await navigator.clipboard.writeText(json)
        setStatus('✓ Notifiche attive. Codice copiato negli appunti: incollalo in chat a Claude.')
      } catch {
        setStatus('✓ Notifiche attive. Copia il codice qui sotto e incollalo in chat a Claude.')
      }
    } catch (e) {
      setStatus('Errore: ' + e.message)
    }
  }

  return (
    <SystemWindow title="Promemoria">
      {!supported ? (
        <p className="hint">
          Le notifiche funzionano solo dall'app installata sulla schermata Home (iOS 16.4+).
        </p>
      ) : (
        <>
          <p className="hint">
            Ricevi ogni giorno alle 16 il promemoria delle missioni giornaliere.
          </p>
          <button className="btn secondary" onClick={enable}>
            🔔 Attiva promemoria
          </button>
          {status && <p className="hint" style={{ marginTop: 8 }}>{status}</p>}
          {subJson && (
            <textarea readOnly rows="4" value={subJson} onFocus={(e) => e.target.select()} />
          )}
        </>
      )}
    </SystemWindow>
  )
}

export default function Profile({ data, setData }) {
  const fileRef = useRef(null)
  const { level, xp } = data.profile
  const rank = rankForLevel(level)
  const needed = xpForNextLevel(level)
  const weekStreak = computeWeekStreak(data.logs, data.profile.weekStreak)

  const missionsDone = Object.values(data.dailyTicks).reduce((n, ids) => n + ids.length, 0)
  let questsFailed = 0
  const yesterday = toKey(addDays(new Date(), -1))
  for (let k = PENALTY_SINCE; k <= yesterday; k = toKey(addDays(fromKey(k), 1))) {
    if (isMissedDay(data, k)) questsFailed += 1
  }
  const kmBySport = (sport) =>
    data.logs.filter((l) => l.sport === sport).reduce((n, l) => n + (l.distanceKm || 0), 0)
  const fmtKm = (km) => (km >= 100 ? Math.round(km) : Math.round(km * 10) / 10)
  const runKm = fmtKm(kmBySport('run'))
  const swimKm = fmtKm(kmBySport('swim'))
  const bikeKm = fmtKm(kmBySport('bike'))
  const countBySport = (sport) => data.logs.filter((l) => l.sport === sport).length

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
            <div className="stat-value" style={{ color: '#ffb547' }}>{weekStreak}</div>
            <div className="stat-label" style={{ color: 'rgba(255, 200, 130, 0.75)' }}>
              Settimane di fila
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{data.logs.length}</div>
            <div className="stat-label">Workout totali</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{missionsDone}</div>
            <div className="stat-label">Missioni completate</div>
          </div>
          <div className="stat-box">
            <div
              className="stat-value"
              style={questsFailed > 0 ? { color: 'var(--danger)' } : undefined}
            >
              {questsFailed}
            </div>
            <div className="stat-label">Quest fallite</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{runKm} km</div>
            <div className="stat-label">Corsa</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{swimKm} km</div>
            <div className="stat-label">Nuoto</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{bikeKm} km</div>
            <div className="stat-label">Ciclismo</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{countBySport('weights')}</div>
            <div className="stat-label">Palestra</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{countBySport('tennis')}</div>
            <div className="stat-label">Tennis</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{countBySport('padel')}</div>
            <div className="stat-label">Padel</div>
          </div>
        </div>
      </SystemWindow>

      <NotificationSetup />

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
