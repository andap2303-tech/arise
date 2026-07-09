import { addDays, toKey, weekStart } from './dates.js'
import { sportName } from './sports.js'

export const GOAL_TYPES = {
  workouts: 'Allenamenti a settimana',
  run_km: 'Km di corsa a settimana',
  sport: 'Sessioni di uno sport',
}

export function defaultGoals() {
  return [
    { id: 'goal-workouts', label: 'Allenamenti', type: 'workouts', target: 4 },
    { id: 'goal-run', label: 'Corsa', type: 'run_km', target: 10 },
  ]
}

function weekLogs(logs, refDate) {
  const ws = toKey(weekStart(refDate))
  const we = toKey(addDays(weekStart(refDate), 6))
  return logs.filter((l) => l.date >= ws && l.date <= we)
}

// Ritorna { current, target, unit, label } per un goal nella settimana di refDate
export function goalProgress(goal, logs, refDate = new Date()) {
  const wl = weekLogs(logs, refDate)
  let current = 0
  let unit = ''
  if (goal.type === 'workouts') {
    current = wl.length
  } else if (goal.type === 'run_km') {
    current = Math.round(wl.filter((l) => l.sport === 'run').reduce((s, l) => s + (l.distanceKm || 0), 0) * 10) / 10
    unit = ' km'
  } else if (goal.type === 'sport') {
    current = wl.filter((l) => l.sport === goal.sport).length
  }
  return {
    current,
    target: goal.target,
    unit,
    label: goal.label || (goal.type === 'sport' ? sportName(goal.sport) : GOAL_TYPES[goal.type]),
    done: current >= goal.target,
  }
}
