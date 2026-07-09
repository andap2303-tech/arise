import { useState } from 'react'
import SportIcon from './SportIcon.jsx'
import { MONTH_NAMES, toKey, todayKey } from '../logic/dates.js'

const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export default function Calendar({ logsByDate, selected, onSelect }) {
  const now = new Date()
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const first = new Date(month.y, month.m, 1)
  const firstDow = first.getDay() === 0 ? 7 : first.getDay() // 1=lun
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate()
  const today = todayKey()

  const cells = []
  for (let i = 1; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prev = () => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
  const next = () => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))

  return (
    <div>
      <div className="cal-header">
        <button className="cal-nav" onClick={prev}>‹</button>
        <span className="cal-month">{MONTH_NAMES[month.m]} {month.y}</span>
        <button className="cal-nav" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {DOW.map((d, i) => (
          <span key={i} className="cal-dow">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={'e' + i} />
          const key = toKey(new Date(month.y, month.m, d))
          const log = logsByDate.get(key)
          const cls = [
            'cal-day',
            'in-month',
            key === today ? 'today' : '',
            log ? 'has-log' : '',
            key === selected ? 'selected' : '',
          ].join(' ')
          return (
            <button key={key} className={cls} onClick={() => onSelect(key)}>
              {log ? <SportIcon sport={log.sport} size={21} /> : d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
