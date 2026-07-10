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
