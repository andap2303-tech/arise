import SystemWindow from './SystemWindow.jsx'

export default function QuestPopup({ result, onClose }) {
  if (!result) return null
  const { xpEarned, bonus, leveledUp, newLevel, rankChanged, newRank, streak } = result
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
        <SystemWindow title="Quest completata" variant={leveledUp ? 'purple' : undefined}>
          <div className="popup-body">
            <div className="popup-xp">+{xpEarned} XP</div>
            {bonus > 0 && (
              <div className="popup-note">
                include +{bonus} XP bonus streak ({streak} giorni consecutivi)
              </div>
            )}
            {leveledUp && <div className="popup-levelup">▲ LEVEL UP — LV. {newLevel}</div>}
            {rankChanged && (
              <div className="popup-levelup" style={{ color: newRank.color, textShadow: `0 0 16px ${newRank.color}` }}>
                NUOVO RANK: {newRank.rank}
              </div>
            )}
            {!leveledUp && <div className="popup-note">Il Sistema ha registrato i tuoi progressi.</div>}
            <button className="btn" onClick={onClose}>OK</button>
          </div>
        </SystemWindow>
      </div>
    </div>
  )
}
