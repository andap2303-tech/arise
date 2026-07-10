import { fromKey, isoWeekday } from './dates.js'

// Il piano giusto per una certa data: tra i piani già "partiti" a quella data
// (startDate assente = valido da sempre) vince quello con partenza più
// recente; a parità, l'ultimo dell'array (semantica "Riattiva").
export function planForDate(plans, dayKey) {
  let best = null
  for (const p of plans) {
    const start = p.startDate || ''
    if (start > dayKey) continue
    if (!best || start >= (best.startDate || '')) best = p
  }
  return best
}

function weekdayPlanDay(plans, dayKey) {
  const plan = planForDate(plans, dayKey)
  const wd = isoWeekday(fromKey(dayKey))
  return plan?.days.find((d) => d.weekday === wd && d.exercises.length > 0) || null
}

// L'allenamento previsto per una data, tenendo conto dei posticipi
// (data.moves = { origine: destinazione }): il giorno d'origine resta scarico,
// la destinazione eredita l'allenamento (e copre l'eventuale suo).
export function plannedDayForDate(data, dayKey) {
  const moves = data.moves || {}
  if (moves[dayKey]) return null
  const orig = Object.keys(moves).find((k) => moves[k] === dayKey)
  if (orig) return weekdayPlanDay(data.plans, orig)
  return weekdayPlanDay(data.plans, dayKey)
}
