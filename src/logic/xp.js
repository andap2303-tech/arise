export const XP_PER_WORKOUT = 100

export function streakBonus(streak) {
  return Math.min(Math.max(streak - 1, 0) * 10, 50)
}

// XP necessari per passare da `level` a `level + 1`
export function xpForNextLevel(level) {
  return level * 200
}

export const RANKS = [
  { rank: 'E', minLevel: 1, color: '#9ca3af' },
  { rank: 'D', minLevel: 5, color: '#34d399' },
  { rank: 'C', minLevel: 10, color: '#4aa8ff' },
  { rank: 'B', minLevel: 15, color: '#00d4ff' },
  { rank: 'A', minLevel: 20, color: '#fbbf24' },
  { rank: 'S', minLevel: 30, color: '#a855f7' },
]

export function rankForLevel(level) {
  let current = RANKS[0]
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r
  }
  return current
}

// Toglie XP al profilo (es. untick di una missione), prendendo in prestito
// dal livello precedente se serve, senza scendere sotto Lv1 / 0 xp.
export function removeXp(profile, amount) {
  let { xp, level } = profile
  xp -= amount
  while (xp < 0 && level > 1) {
    level -= 1
    xp += xpForNextLevel(level)
  }
  if (xp < 0) xp = 0
  return { ...profile, xp, level }
}

// Applica XP al profilo; xp è il progresso nel livello corrente.
// Ritorna { profile, leveledUp, oldRank, newRank }
export function applyXp(profile, amount) {
  let { xp, level } = profile
  const oldLevel = level
  xp += amount
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level)
    level += 1
  }
  return {
    profile: { ...profile, xp, level },
    leveledUp: level > oldLevel,
    oldRank: rankForLevel(oldLevel),
    newRank: rankForLevel(level),
  }
}
