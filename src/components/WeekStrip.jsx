import SportIcon from './SportIcon.jsx'
import { addDays, MONTH_NAMES, toKey, todayKey, weekStart } from '../logic/dates.js'

const DOW = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export default function WeekStrip({ logs, selected, onSelect }) {
  const start = weekStart(new Date())
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

  return (
    <div className="week-strip">
      <div className="week-strip-label">{label.toUpperCase()}</div>
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
                {log ? <SportIcon sport={log.sport} size={19} /> : <span className="week-day-dot" />}
              </span>
              <span className="week-day-num">{date.getDate()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
