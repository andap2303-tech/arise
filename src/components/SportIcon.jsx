// Icone sport line-art in stile HUD. Ereditano il colore via currentColor.
const paths = {
  run: (
    // scarpa da corsa stilizzata
    <>
      <path d="M3 17.5h18c0-2.2-1.6-3.3-4-3.8-2.2-.5-3.8-1.5-4.6-3.2L11.6 9 8.4 10.4l.4 2.6c-1.6.4-3.3.5-4.3.5-.9 0-1.5.7-1.5 1.6v2.4z" />
      <path d="M12 13.5l-1 1.5M14.5 14.5l-1 1.5" />
    </>
  ),
  swim: (
    // occhialini da nuoto
    <>
      <circle cx="7.5" cy="12" r="3.2" />
      <circle cx="16.5" cy="12" r="3.2" />
      <path d="M10.7 12h2.6M4.3 12H2.5M19.7 12h1.8" />
    </>
  ),
  tennis: (
    // racchetta da tennis
    <>
      <ellipse cx="13.5" cy="7.5" rx="4.8" ry="6" transform="rotate(35 13.5 7.5)" />
      <path d="M10 12.5L4.5 20M11.5 5.5l4.5 5M9.8 8.2l6 4" />
    </>
  ),
  padel: (
    // racchetta da padel (piatto pieno con fori)
    <>
      <ellipse cx="13.5" cy="7.8" rx="4.6" ry="5.6" transform="rotate(35 13.5 7.8)" />
      <path d="M10.2 12.6L5 19.8" />
      <path d="M12.5 6.5h.01M15.5 8.5h.01M12 9.5h.01" strokeWidth="2.4" />
    </>
  ),
  weights: (
    // manubrio
    <>
      <path d="M7.5 7.5v9M16.5 7.5v9M4.5 9.5v5M19.5 9.5v5M7.5 12h9M2.5 12h2M19.5 12h2" />
    </>
  ),
  bike: (
    // bicicletta
    <>
      <circle cx="6" cy="15.5" r="3.5" />
      <circle cx="18" cy="15.5" r="3.5" />
      <path d="M6 15.5l4-7h5.5M10 8.5L13 15.5h5M13 6h3" />
    </>
  ),
  other: (
    // fulmine
    <path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12L13 3z" />
  ),
}

export default function SportIcon({ sport, size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[sport] || paths.other}
    </svg>
  )
}
