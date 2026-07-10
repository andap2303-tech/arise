import { useEffect, useState } from 'react'
import { todayKey } from './logic/dates.js'
import { defaultGoals } from './logic/goals.js'
import { inferSport } from './logic/sports.js'
import { newId } from './logic/ids.js'
import { applyXp } from './logic/xp.js'
import { mergeStravaActivities } from './logic/strava.js'
import stravaSeed from './data/strava-seed.json'

const KEY = 'arise-data'

// Streak reale di Andrea al momento del seed: 17 settimane nella settimana
// del 6 luglio 2026. Da qui in poi conta l'app.
const WEEK_STREAK_SEED = { base: 17, baseWeekStart: '2026-07-06' }

function defaultWorkoutTypes() {
  return {
    run: ['Intervalli', 'Corsa lunga', 'Defaticante'],
    weights: ['Push', 'Pull', 'Legs', 'Full body'],
    tennis: ['Partita', 'Allenamento'],
    padel: ['Partita', 'Allenamento'],
    swim: ['Tecnica', 'Resistenza'],
    bike: [],
    other: [],
  }
}

function defaultDailyQuests() {
  return [
    { id: 'dq-reading', label: 'Leggere 15 minuti' },
    { id: 'dq-pushups', label: '20 piegamenti' },
    { id: 'dq-situps', label: '20 addominali' },
  ]
}

// Storico Strava precaricato: fuso nei log con dedupe per stravaId, quindi
// sicuro anche se le stesse attività sono già state incollate a mano.
function seedStravaLogs(data) {
  const activities = stravaSeed.stravaActivities.map((a) => ({
    stravaId: String(a.id),
    date: a.date,
    title: a.title,
    sport: a.sport,
    durationMin: a.durationMin || null,
    distanceKm: a.distanceKm || null,
    calories: a.calories || null,
  }))
  const { logs, added, xpGained } = mergeStravaActivities(data.logs, activities)
  data.logs = logs
  if (added > 0) data.profile = applyXp(data.profile, xpGained).profile
}

function migrate(data) {
  if (!data.profile.weekStreak) data.profile.weekStreak = { ...WEEK_STREAK_SEED }
  if (!Array.isArray(data.goals) || data.goals.length === 0) data.goals = defaultGoals()
  if (!Array.isArray(data.dailyQuests)) data.dailyQuests = defaultDailyQuests()
  // v4: la lettura entra nelle missioni di default; una volta sola, così se
  // Andrea la elimina dall'editor non viene re-inserita a ogni avvio.
  if ((data.version || 0) < 4 && !data.dailyQuests.some((q) => q.id === 'dq-reading')) {
    data.dailyQuests.unshift({ id: 'dq-reading', label: 'Leggere 15 minuti' })
  }
  if (!data.dailyTicks || typeof data.dailyTicks !== 'object') data.dailyTicks = {}
  if (!data.workoutTypes || typeof data.workoutTypes !== 'object') data.workoutTypes = defaultWorkoutTypes()
  if (!data.stravaSeeded) {
    seedStravaLogs(data)
    data.stravaSeeded = true
  }
  data.logs = data.logs.map((l) => ({
    ...l,
    sport: l.sport || inferSport(l.title, ...(l.exercises || []).map((e) => e.name)),
    distanceKm:
      l.distanceKm ?? (Number(String(l.title).match(/([\d.,]+)\s*km/i)?.[1]?.replace(',', '.')) || undefined),
  }))
  data.plans = data.plans.map((p) => ({
    ...p,
    days: (p.days || []).map((d) => {
      const inferred = inferSport(d.title)
      return { ...d, sport: d.sport || (inferred !== 'other' ? inferred : 'weights') }
    }),
  }))
  // v5: il piano di esempio lascia il posto alla settimana reale, ma solo se
  // è ancora lui il piano attivo (un piano incollato a mano non si tocca).
  if ((data.version || 0) < 5 && data.plans[data.plans.length - 1]?.id === 'sample-plan') {
    data.plans = data.plans.map((p) => (p.id === 'sample-plan' ? realWeekPlan() : p))
  }
  data.version = 5
  return data
}

// La settimana reale di Andrea (dettata in chat il 2026-07-10)
function realWeekPlan() {
  return {
    id: 'plan-week-v1',
    name: 'Settimana corsa + nuoto',
    createdAt: todayKey(),
    days: [
      {
        weekday: 1,
        title: 'Corsa - Fondo',
        sport: 'run',
        exercises: [
          { name: '5 km continui', sets: '', reps: '', weight: '', notes: 'ritmo ~5:16/km' },
        ],
      },
      {
        weekday: 3,
        title: 'Nuoto - Tecnica',
        sport: 'swim',
        exercises: [
          { name: '8 × 100 m con pause', sets: '', reps: '', weight: '', notes: '~1 km totale' },
        ],
      },
      {
        weekday: 4,
        title: 'Corsa - Qualità',
        sport: 'run',
        exercises: [
          {
            name: 'Ripetute 5 × 3 min',
            sets: '',
            reps: '',
            weight: '',
            notes: 'ritmo 5:00-5:15/km, recupero 2 min',
          },
        ],
      },
      {
        weekday: 6,
        title: 'Nuoto - Distanza',
        sport: 'swim',
        exercises: [
          { name: 'Riscaldamento 200 m', sets: '', reps: '', weight: '', notes: '' },
          {
            name: '800 m continui',
            sets: '',
            reps: '',
            weight: '',
            notes: 'oppure 4 × 200 m con 15-20s pausa, ritmo blando — aerobico, niente accelerazioni',
          },
          { name: 'Defaticamento 150 m', sets: '', reps: '', weight: '', notes: '' },
        ],
      },
      {
        weekday: 7,
        title: 'Tennis o padel (bonus opzionale)',
        sport: 'tennis',
        exercises: [
          {
            name: 'Attività libera',
            sets: '',
            reps: '',
            weight: '',
            notes: 'opzionale: tennis, padel o quello che va — se salti non è un problema',
          },
        ],
      },
    ],
  }
}

function defaultData() {
  return migrate({
    profile: { xp: 0, level: 1 },
    plans: [realWeekPlan()],
    logs: [],
  })
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData()
    const data = JSON.parse(raw)
    const def = defaultData()
    return migrate({
      ...def,
      ...data,
      profile: { ...def.profile, ...(data.profile || {}) },
      plans: Array.isArray(data.plans) ? data.plans : def.plans,
      logs: Array.isArray(data.logs) ? data.logs : [],
      // il default è già seedato: per i dati salvati conta SOLO il loro flag,
      // altrimenti chi aveva dati pre-v3 non riceverebbe mai lo storico Strava
      stravaSeeded: data.stravaSeeded === true,
    })
  } catch {
    return defaultData()
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function useAppData() {
  const [data, setData] = useState(loadData)
  useEffect(() => {
    saveData(data)
  }, [data])
  return [data, setData]
}

// Piano attivo = l'ultimo aggiunto
export function activePlan(data) {
  return data.plans.length > 0 ? data.plans[data.plans.length - 1] : null
}
