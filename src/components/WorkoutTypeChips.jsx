import { useState } from 'react'

// Chips del tipo di allenamento per uno sport (es. corsa: Intervalli, Corsa
// lunga, Defaticante). "+" aggiunge un tipo nuovo, ✎ attiva la rimozione.
// props: types (array), value, onChange(tipo|null), onTypesChange(nuovaLista)
export default function WorkoutTypeChips({ types, value, onChange, onTypesChange }) {
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('')
  const [removing, setRemoving] = useState(false)

  function confirmAdd() {
    const t = newType.trim()
    if (t && !types.includes(t)) {
      onTypesChange([...types, t])
      onChange(t)
    }
    setNewType('')
    setAdding(false)
  }

  function remove(t) {
    onTypesChange(types.filter((x) => x !== t))
    if (value === t) onChange(null)
  }

  return (
    <div className="type-chips">
      {types.map((t) => (
        <button
          key={t}
          className={'sport-chip type-chip' + (value === t ? ' on' : '')}
          onClick={() => (removing ? remove(t) : onChange(value === t ? null : t))}
        >
          {t}
          {removing && <span className="chip-x">✕</span>}
        </button>
      ))}
      {adding ? (
        <span className="type-add-inline">
          <input
            type="text"
            autoFocus
            placeholder="Nuovo tipo"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
          />
          <button className="sport-chip" onClick={confirmAdd}>✓</button>
        </span>
      ) : (
        <button className="sport-chip type-chip ghost" onClick={() => setAdding(true)}>+</button>
      )}
      {types.length > 0 && (
        <button
          className={'sport-chip type-chip ghost' + (removing ? ' on' : '')}
          onClick={() => setRemoving((r) => !r)}
        >
          ✎
        </button>
      )}
    </div>
  )
}
