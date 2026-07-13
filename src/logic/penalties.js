import { addDays, diffDays, fromKey, isoWeekday, toKey, todayKey } from './dates.js'
import { removeXp } from './xp.js'
import { plannedDayForDate } from './plans.js'

// Le penalità esistono da quando esistono le missioni: prima di questa data
// nessun giorno viene giudicato.
export const PENALTY_SINCE = '2026-07-09'

export const XP_PENALTY_MISSION = 10
export const XP_PENALTY_WORKOUT = 100

// I giorni "bonus" del piano (es. tennis della domenica) non puniscono.
export function isOptionalDay(planDay) {
  return /opzional/i.test(planDay?.title || '')
}

export function questsForDay(quests, dayKey) {
  return quests.filter((q) => {
    const since = q.since || PENALTY_SINCE
    if (since > dayKey) return false
    if (q.until && dayKey > q.until) return false
    if (q.days && !q.days.includes(isoWeekday(fromKey(dayKey)))) return false
    if (q.everyN && diffDays(since, dayKey) % q.everyN !== 0) return false
    return true
  })
}

export function missedWorkoutPenalty(data, dayKey) {
  const planDay = plannedDayForDate(data, dayKey)
  if (!planDay || isOptionalDay(planDay)) return 0
  const trained = data.logs.some((l) => l.date === dayKey)
  return trained ? 0 : XP_PENALTY_WORKOUT
}

// Giorno passato con allenamento previsto (posticipi inclusi) e nessun log.
export function isMissedDay(data, dayKey) {
  if (dayKey >= todayKey() || dayKey < PENALTY_SINCE) return false
  const planDay = plannedDayForDate(data, dayKey)
  if (!planDay || isOptionalDay(planDay)) return false
  return !data.logs.some((l) => l.date === dayKey)
}

// Giudica tutti i giorni passati non ancora giudicati (fino a ieri compreso)
// e toglie gli XP delle missioni saltate e degli allenamenti saltati.
export function settlePenalties(data) {
  const yesterday = toKey(addDays(new Date(), -1))
  let day = data.lastPenaltyDay
    ? toKey(addDays(fromKey(data.lastPenaltyDay), 1))
    : PENALTY_SINCE
  if (day > yesterday) return data

  let total = 0
  for (; day <= yesterday; day = toKey(addDays(fromKey(day), 1))) {
    const ticked = new Set(data.dailyTicks[day] || [])
    const missedMissions = questsForDay(data.dailyQuests, day).filter((q) => !ticked.has(q.id))
    total += missedMissions.length * XP_PENALTY_MISSION
    total += missedWorkoutPenalty(data, day)
  }

  return {
    ...data,
    profile: total > 0 ? removeXp(data.profile, total) : data.profile,
    lastPenaltyDay: yesterday,
  }
}
