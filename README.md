# ARISE — Workout tracker personale (stile Solo Leveling)

PWA personale per tracciare i workout: la scheda settimanale si genera con Claude
e si incolla nell'app, gli allenamenti completati danno XP, livelli, rank da
Hunter, streak settimanale e obiettivi.

## Comandi

```bash
npm install        # solo la prima volta
npm run dev        # sviluppo su http://localhost:5173
npm run build      # build di produzione in dist/
npm run preview    # serve la build su http://localhost:4173
```

## Come si usa

- **Quest (home)**: in alto la streak di settimane consecutive (stile Strava,
  partita da 17) e la settimana corrente con l'icona dello sport nei giorni
  allenati (scarpa=corsa, occhialini=nuoto, racchetta=tennis/padel,
  manubrio=pesi). Sotto: gli **anelli** degli obiettivi settimanali (oro quando
  completati, ✎ per modificarli), la Daily Quest del giorno da spuntare e le
  **missioni giornaliere** (default: 20 piegamenti e 20 addominali, +10 XP
  l'una, si sbarrano al tick).
- Al primo avvio l'app è già popolata con lo storico Strava 2026 di Andrea
  (63 allenamenti, seed in `src/data/strava-seed.json`): streak e calendario
  sono subito pieni.
- **Piani → Incolla e carica**: un unico punto di caricamento. Incolli un JSON e
  l'app riconosce da sola se è una **scheda settimanale** o una lista di
  **attività Strava** (i duplicati vengono saltati). Le schede si possono anche
  modificare a mano.
- **Storico**: calendario con l'icona dello sport nei giorni allenati, ricerca e
  contatori. Aprendo un giorno si può **modificare** o **eliminare**
  l'allenamento (l'eliminazione toglie anche gli XP guadagnati).
- Ogni allenamento ha uno **sport** ben visibile (badge "CORSA · INTERVALLI"),
  un **tipo** opzionale scelto tra chip personalizzabili per sport (il "+"
  aggiunge tipi nuovi, ✎ li rimuove) e una **descrizione** libera opzionale.
- **Status**: livello, rank (E→S), streak e statistiche. In fondo, il link per
  salvare/ripristinare il backup dei dati (vivono solo sul dispositivo).

## Formato della scheda settimanale

Chiedi a Claude una scheda in questo formato (weekday: 1=lunedì … 7=domenica,
solo i giorni di allenamento; `sport` opzionale: run/swim/tennis/padel/weights/bike):

```json
{
  "name": "Nome scheda",
  "days": [
    { "weekday": 1, "title": "Push - Petto e spalle", "sport": "weights",
      "exercises": [ { "name": "Panca piana", "sets": 4, "reps": "8-10", "weight": "60kg" } ] }
  ]
}
```

## Attività Strava

Chiedi in una sessione Claude: *"dammi i miei ultimi allenamenti Strava in JSON
per ARISE"* — il connettore Strava è collegato in sola lettura. Il JSON si
incolla nello stesso punto di caricamento. Un export con le attività del 2026 è
già pronto in `strava-import.json`.

## Pubblicazione sul telefono

L'app è statica: basta pubblicare la cartella `dist/` su un hosting gratuito
(GitHub Pages, Netlify, Cloudflare Pages). Poi dal telefono: apri l'URL e usa
"Aggiungi a schermata Home".
