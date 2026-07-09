// Import di attività Strava incollate come JSON (generato chiedendolo a Claude).
// Formato accettato: { "stravaActivities": [ { id, date, title, sport, durationMin,
// distanceKm?, calories? } ] } oppure direttamente l'array.

import { newId } from './ids.js'
import { XP_PER_WORKOUT } from './xp.js'
import { inferSport } from './sports.js'

const SPORT_LABELS = {
  run: 'Corsa',
  trailrun: 'Trail running',
  ride: 'Bici',
  virtualride: 'Bici indoor',
  swim: 'Nuoto',
  weighttraining: 'Pesi',
  workout: 'Allenamento',
  tennis: 'Tennis',
  padel: 'Padel',
  walk: 'Camminata',
  hike: 'Escursione',
  yoga: 'Yoga',
  crossfit: 'CrossFit',
  soccer: 'Calcio',
}

export function sportLabel(sport) {
  return SPORT_LABELS[String(sport || '').toLowerCase()] || sport || 'Allenamento'
}

function extractJson(text) {
  let t = text.replace(/```[a-z]*\n?/gi, '')
  const objStart = t.indexOf('{')
  const arrStart = t.indexOf('[')
  const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart)
  if (start === -1) return null
  const endChar = t[start] === '{' ? '}' : ']'
  const end = t.lastIndexOf(endChar)
  if (end <= start) return null
  return t.slice(start, end + 1)
}

// Ritorna { activities, error }
export function parseStravaActivities(text) {
  if (!text || !text.trim()) return { activities: null, error: 'Incolla prima il JSON delle attività.' }
  const jsonText = extractJson(text)
  if (!jsonText) return { activities: null, error: 'Nessun blocco JSON trovato.' }

  let raw
  try {
    raw = JSON.parse(jsonText)
  } catch (e) {
    return { activities: null, error: 'JSON non valido: ' + e.message }
  }

  const list = Array.isArray(raw) ? raw : raw.stravaActivities || raw.activities
  if (!Array.isArray(list) || list.length === 0) {
    return { activities: null, error: 'Nessuna attività trovata nel JSON.' }
  }

  const activities = []
  for (const a of list) {
    const date = String(a.date || a.start_local || '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { activities: null, error: `Data non valida in un'attività: "${a.date ?? '?'}" (serve YYYY-MM-DD).` }
    }
    activities.push({
      stravaId: String(a.id ?? a.stravaId ?? ''),
      date,
      title: String(a.title ?? a.name ?? 'Allenamento').trim(),
      sport: a.sport ?? a.sport_type ?? '',
      durationMin: Number(a.durationMin ?? 0) || null,
      distanceKm: Number(a.distanceKm ?? 0) || null,
      calories: Number(a.calories ?? 0) || null,
    })
  }
  return { activities, error: null }
}

function activityToLog(a) {
  const label = sportLabel(a.sport)
  const details = []
  if (a.durationMin) details.push(`${a.durationMin} min`)
  if (a.calories) details.push(`${a.calories} kcal`)
  return {
    id: newId(),
    date: a.date,
    title: a.distanceKm ? `${label} ${a.distanceKm} km` : label,
    exercises: [{ name: a.title, sets: '', reps: '', notes: details.join(' · '), done: true }],
    xpEarned: XP_PER_WORKOUT,
    completedAt: a.date + 'T12:00:00.000Z',
    source: 'strava',
    stravaId: a.stravaId,
    sport: inferSport(a.sport, a.title),
    distanceKm: a.distanceKm || undefined,
  }
}

// Unisce le attività ai log esistenti saltando i duplicati.
// Ritorna { logs, added, skipped, xpGained }
export function mergeStravaActivities(logs, activities) {
  const knownIds = new Set(logs.filter((l) => l.stravaId).map((l) => l.stravaId))
  const newLogs = [...logs]
  let added = 0
  let skipped = 0
  for (const a of activities) {
    if (a.stravaId && knownIds.has(a.stravaId)) {
      skipped++
      continue
    }
    knownIds.add(a.stravaId)
    newLogs.push(activityToLog(a))
    added++
  }
  newLogs.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))
  return { logs: newLogs, added, skipped, xpGained: added * XP_PER_WORKOUT }
}

export const STRAVA_PROMPT = `Dammi le mie ultime attività Strava in questo formato JSON per l'app ARISE, senza altro testo:

{
  "stravaActivities": [
    { "id": "123456", "date": "2026-07-09", "title": "Evening Run", "sport": "Run", "durationMin": 46, "distanceKm": 7.1, "calories": 505 }
  ]
}`
