// Sport riconosciuti dall'app: chiave interna, etichetta italiana.
export const SPORTS = {
  run: { label: 'Corsa' },
  swim: { label: 'Nuoto' },
  tennis: { label: 'Tennis' },
  padel: { label: 'Padel' },
  weights: { label: 'Pesi' },
  bike: { label: 'Bici' },
  other: { label: 'Altro' },
}

export function sportName(key) {
  return SPORTS[key]?.label || SPORTS.other.label
}

const PATTERNS = [
  [/(^|\W)(run|corsa|running|trail)/i, 'run'],
  [/(swim|nuoto)/i, 'swim'],
  [/tennis/i, 'tennis'],
  [/padel/i, 'padel'],
  [/(weight|pesi|palestra|gym|push|pull|legs|upper|lower|forza)/i, 'weights'],
  [/(ride|bici|bike|cycling|ciclismo)/i, 'bike'],
]

// Inferisce lo sport da un testo libero (titolo, sport_type Strava, ...)
export function inferSport(...texts) {
  const t = texts.filter(Boolean).join(' ')
  for (const [re, key] of PATTERNS) {
    if (re.test(t)) return key
  }
  return 'other'
}
