// Parser tollerante per i piani incollati da Claude/GPT.
// Accetta JSON puro, JSON dentro code block ``` ... ```, o JSON con testo attorno.

import { inferSport } from './sports.js'

const DAY_ALIASES = {
  1: ['1', 'lunedi', 'lunedì', 'lun', 'monday', 'mon'],
  2: ['2', 'martedi', 'martedì', 'mar', 'tuesday', 'tue'],
  3: ['3', 'mercoledi', 'mercoledì', 'mer', 'wednesday', 'wed'],
  4: ['4', 'giovedi', 'giovedì', 'gio', 'thursday', 'thu'],
  5: ['5', 'venerdi', 'venerdì', 'ven', 'friday', 'fri'],
  6: ['6', 'sabato', 'sab', 'saturday', 'sat'],
  7: ['7', 'domenica', 'dom', 'sunday', 'sun'],
}

function normalizeWeekday(value) {
  const v = String(value).trim().toLowerCase()
  for (const [num, aliases] of Object.entries(DAY_ALIASES)) {
    if (aliases.includes(v)) return Number(num)
  }
  return null
}

function extractJson(text) {
  // togli eventuali code fence
  let t = text.replace(/```[a-z]*\n?/gi, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return t.slice(start, end + 1)
}

// Ritorna { plan, error }
export function parsePlan(text) {
  if (!text || !text.trim()) return { plan: null, error: 'Incolla il piano prima.' }

  const jsonText = extractJson(text)
  if (!jsonText) return { plan: null, error: 'Nessun blocco JSON trovato nel testo incollato.' }

  let raw
  try {
    raw = JSON.parse(jsonText)
  } catch (e) {
    return { plan: null, error: 'JSON non valido: ' + e.message }
  }

  const daysRaw = raw.days || raw.giorni
  if (!Array.isArray(daysRaw) || daysRaw.length === 0) {
    return { plan: null, error: 'Il piano deve avere una lista "days" con almeno un giorno.' }
  }

  const days = []
  for (const d of daysRaw) {
    const weekday = normalizeWeekday(d.weekday ?? d.day ?? d.giorno)
    if (!weekday) {
      return {
        plan: null,
        error: `Giorno non riconosciuto: "${d.weekday ?? d.day ?? d.giorno ?? '?'}" (usa 1-7 o il nome del giorno).`,
      }
    }
    const exercisesRaw = d.exercises || d.esercizi || []
    if (!Array.isArray(exercisesRaw)) {
      return { plan: null, error: `"exercises" deve essere una lista (giorno ${weekday}).` }
    }
    const exercises = exercisesRaw.map((e) => ({
      name: String(e.name ?? e.nome ?? '').trim(),
      sets: e.sets ?? e.serie ?? '',
      reps: e.reps ?? e.ripetizioni ?? '',
      weight: e.weight ?? e.peso ?? '',
      notes: e.notes ?? e.note ?? '',
    }))
    if (exercises.some((e) => !e.name)) {
      return { plan: null, error: `Ogni esercizio deve avere un nome (giorno ${weekday}).` }
    }
    const title = String(d.title ?? d.titolo ?? 'Workout').trim()
    const inferred = inferSport(d.sport, title)
    days.push({
      weekday,
      title,
      sport: inferred !== 'other' ? inferred : 'weights',
      exercises,
    })
  }

  days.sort((a, b) => a.weekday - b.weekday)

  return {
    plan: {
      name: String(raw.name ?? raw.nome ?? 'Piano di allenamento').trim(),
      days,
    },
    error: null,
  }
}

export const PLAN_PROMPT = `Creami un piano di allenamento settimanale personalizzato per me.
[Descrivi qui i tuoi obiettivi, giorni disponibili, attrezzatura, livello...]

Rispondimi SOLO con un blocco JSON in questo formato esatto, senza altro testo:

{
  "name": "Nome del piano",
  "days": [
    {
      "weekday": 1,
      "title": "Push - Petto e spalle",
      "exercises": [
        { "name": "Panca piana", "sets": 4, "reps": "8-10", "weight": "60kg", "notes": "ultimo set a cedimento" },
        { "name": "Shoulder press", "sets": 3, "reps": 10 }
      ]
    }
  ]
}

Regole:
- "weekday": 1=lunedì, 2=martedì, 3=mercoledì, 4=giovedì, 5=venerdì, 6=sabato, 7=domenica
- Includi SOLO i giorni di allenamento (ometti i giorni di riposo)
- "weight" e "notes" sono opzionali
- "reps" può essere un numero o una stringa come "8-12" o "30 sec"`
