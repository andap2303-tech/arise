import { useRef, useState } from 'react'
import SportIcon from './SportIcon.jsx'
import { addDays, MONTH_NAMES, toKey, todayKey, weekStart } from '../logic/dates.js'
import { isMissedDay } from '../logic/penalties.js'

const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export default function WeekStrip({ data, logs, selected, onSelect }) {
  const [offset, setOffset] = useState(0)
  const touchX = useRef(null)
  const start = weekStart(addDays(new Date(), offset * 7))
  const end = addDays(start, 6)
  const today = todayKey()

  const label =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
      : `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)}`

  const byDate = new Map()
  for (const l of logs) {
    if (!byDate.has(l.date)) byDate.set(l.date, l)
  }

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (dx > 45) setOffset((o) => o - 1)
    else if (dx < -45) setOffset((o) => o + 1)
  }

  return (
    <div className="week-strip" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="week-strip-header">
        <button className="week-nav" onClick={() => setOffset((o) => o - 1)}>‹</button>
        <div
          className={'week-strip-label' + (offset !== 0 ? ' off-week' : '')}
          onClick={() => setOffset(0)}
          title={offset !== 0 ? 'Torna alla settimana corrente' : undefined}
        >
          {label.toUpperCase()}
        </div>
        <button className="week-nav" onClick={() => setOffset((o) => o + 1)}>›</button>
      </div>
      <div className="week-strip-days">
        {DOW.map((letter, i) => {
          const date = addDays(start, i)
          const key = toKey(date)
          const log = byDate.get(key)
          const isToday = key === today
          return (
            <div
              key={key}
              className={
                'week-day' +
                (isToday ? ' today' : '') +
                (log ? ' trained' : '') +
                (selected === key ? ' selected' : '')
              }
              onClick={() => onSelect?.(key)}
            >
              <span className="week-day-letter">{letter}</span>
              <span className="week-day-slot">
                {log ? (
                  <SportIcon sport={log.sport} size={19} />
                ) : isMissedDay(data, key) ? (
                  <span className="missed-x">✕</span>
                ) : (
                  <span className="week-day-dot" />
                )}
              </span>
              <span className="week-day-num">{date.getDate()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
