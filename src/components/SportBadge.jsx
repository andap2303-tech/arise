import SportIcon from './SportIcon.jsx'
import { sportName } from '../logic/sports.js'

// Etichetta ben leggibile dello sport (+ tipo di allenamento se presente):
// [icona] CORSA · INTERVALLI
export default function SportBadge({ sport, workoutType, center }) {
  return (
    <div className={'sport-badge' + (center ? ' center' : '')}>
      <SportIcon sport={sport} size={15} />
      <span>{sportName(sport)}</span>
      {workoutType && <span className="sport-badge-type">· {workoutType}</span>}
    </div>
  )
}
