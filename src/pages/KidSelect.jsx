import { useState } from 'react';
import styles from './KidSelect.module.css';

export default function KidSelect({ config, onSelect, onBack }) {
  const [pickingForKid, setPickingForKid] = useState(null);

  if (!config || config.kids.length === 0) {
    return (
      <div className={styles.page}>
        <button className="btn btn-ghost" onClick={onBack} style={{ position: 'absolute', top: 20, left: 20 }}>← Back</button>
        <div className={styles.empty}>
          <div style={{ fontSize: 64 }}>🤔</div>
          <h2>No kids set up yet</h2>
          <p>Ask a parent to open the Parent Dashboard and add you!</p>
        </div>
      </div>
    );
  }

  const pickingAgents = pickingForKid
    ? config.agents.filter(a => pickingForKid.agentIds.includes(a.id))
    : [];

  return (
    <div className={styles.page}>
      <button className="btn btn-ghost" onClick={onBack} style={{ position: 'absolute', top: 20, left: 20 }}>← Back</button>
      <div className={styles.content}>
        <h1 className={styles.title}>Who's chatting today? 👋</h1>
        <div className={styles.grid}>
          {config.kids.map(kid => {
            const agents = config.agents.filter(a => kid.agentIds.includes(a.id));
            const handleClick = () => {
              if (agents.length === 1) onSelect(kid, agents[0]);
              else if (agents.length > 1) setPickingForKid(kid);
            };

            return (
              <button
                key={kid.id}
                className={styles.kidCard}
                onClick={handleClick}
                disabled={agents.length === 0}
                title={agents.length === 0 ? 'Ask a parent to finish setup' : ''}
                style={agents.length === 0 ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
              >
                <span className={styles.emoji}>{kid.emoji}</span>
                <span className={styles.name}>{kid.name}</span>
                <span className={styles.agents}>
                  {agents.length === 0
                    ? 'No agents yet — ask a parent'
                    : `${agents.length} agent${agents.length !== 1 ? 's' : ''} ready`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {pickingForKid && (
        <div className={styles.pickerOverlay} onClick={() => setPickingForKid(null)}>
          <div className={styles.picker} onClick={e => e.stopPropagation()}>
            <h2 className={styles.pickerTitle}>Hi {pickingForKid.name} {pickingForKid.emoji} — who do you want to chat with?</h2>
            <div className={styles.pickerGrid}>
              {pickingAgents.map(a => (
                <button key={a.id} className={styles.pickerCard} style={{ '--agent-color': a.color }}
                  onClick={() => { const k = pickingForKid; setPickingForKid(null); onSelect(k, a); }}>
                  <span className={styles.pickerEmoji}>{a.emoji}</span>
                  <span className={styles.pickerName}>{a.name}</span>
                  <span className={styles.pickerDesc}>{a.description}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setPickingForKid(null)} style={{ margin: '0 auto', display: 'block' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
