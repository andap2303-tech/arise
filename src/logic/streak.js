import { addDays, fromKey, isoWeekday, toKey, weekStart } from './dates.js'

// Streak settimanale stile Strava: settimane consecutive (lun-dom) con almeno
// un allenamento. `seed` ({ base, baseWeekStart }) fa partire il conteggio da
// una streak pregressa: se la catena di settimane consecutive include la
// settimana del seed, il totale è base + settimane successive; se la catena
// si è spezzata dopo il seed, vale solo il conteggio reale.
// La settimana corrente senza allenamenti non spezza (non è ancora finita).
export function computeWeekStreak(logs, seed, refDate = new Date()) {
  const trainedWeeks = new Set(logs.map((l) => toKey(weekStart(fromKey(l.date)))))
  const chain = []
  let d = weekStart(refDate)
  if (trainedWeeks.has(toKey(d))) chain.push(toKey(d))
  d = addDays(d, -7)
  for (let i = 0; i < 2000; i++) {
    const key = toKey(d)
    if (!trainedWeeks.has(key)) break
    chain.push(key)
    d = addDays(d, -7)
  }
  if (chain.length === 0) return 0

  const latest = chain[0]
  const earliest = chain[chain.length - 1]
  if (seed && earliest <= seed.baseWeekStart && seed.baseWeekStart <= latest) {
    const weeksAfterBase = Math.round(
      (fromKey(latest) - fromKey(seed.baseWeekStart)) / (7 * 86400000),
    )
    return seed.base + weeksAfterBase
  }
  return chain.length
}

// Streak = giorni di allenamento consecutivi partendo da `refDate` (incluso)
// e andando indietro. I giorni di riposo previsti dal piano attivo non
// spezzano la streak; un giorno previsto dal piano ma saltato la spezza.
// Un giorno senza piano attivo conta come riposo.
export function computeStreak(logs, activePlan, refDate = new Date()) {
  const logged = new Set(logs.map((l) => l.date))
  const plannedWeekdays = new Set(
    (activePlan?.days || [])
      .filter((d) => (d.exercises || []).length > 0)
      .map((d) => d.weekday),
  )

  let streak = 0
  let date = new Date(refDate)

  // Il giorno di riferimento conta solo se allenato; se non allenato non
  // spezza (la giornata potrebbe non essere finita), si parte da ieri.
  if (logged.has(toKey(date))) streak += 1
  date = addDays(date, -1)

  for (let i = 0; i < 3660; i++) {
    const key = toKey(date)
    if (logged.has(key)) {
      streak += 1
    } else if (plannedWeekdays.has(isoWeekday(date))) {
      break // giorno previsto ma saltato
    }
    // giorno di riposo senza log: non spezza, non conta
    date = addDays(date, -1)
  }
  return streak
}
