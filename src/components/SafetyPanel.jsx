import { useState } from 'react';
import { AGE_LEVELS } from '../utils/storage';
import styles from './SafetyPanel.module.css';

function AgeLevelSlider({ value, onChange }) {
  const idx = AGE_LEVELS.findIndex(l => l.age === value);
  const safeIdx = idx === -1 ? 2 : idx;
  const current = AGE_LEVELS[safeIdx];

  return (
    <div className={styles.ageLevelWrap}>
      <div className={styles.ageLevelDisplay}>
        <span className={styles.ageLevelBadge}>{current.label}</span>
        <span className={styles.ageLevelDesc}>{current.desc}</span>
      </div>
      <input
        type="range" min={0} max={AGE_LEVELS.length - 1} value={safeIdx}
        onChange={e => onChange(AGE_LEVELS[parseInt(e.target.value)].age)}
        className={styles.ageSlider}
      />
      <div className={styles.ageLevelTicks}>
        {AGE_LEVELS.map((l, i) => (
          <span key={i} className={`${styles.ageTick} ${i === safeIdx ? styles.ageTickActive : ''}`}>{l.age}</span>
        ))}
      </div>
      <div className={styles.ageLevelHint}>{current.instruction.slice(0, 130)}…</div>
    </div>
  );
}

export default function SafetyPanel({ settings, onChange, isKidOverride = false }) {
  const [newWord, setNewWord] = useState('');

  const updateSetting = (key, val) => onChange({ ...settings, [key]: val });

  const toggleTopic = (id) => onChange({
    ...settings,
    restrictedTopics: settings.restrictedTopics.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t),
  });

  const addWord = () => {
    if (!newWord.trim()) return;
    onChange({ ...settings, blockedWords: [...(settings.blockedWords || []), newWord.trim().toLowerCase()] });
    setNewWord('');
  };

  const removeWord = (word) => onChange({
    ...settings,
    blockedWords: (settings.blockedWords || []).filter(w => w !== word),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={styles.settingsCard}>
        <h3>📖 Reading Level</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Sets the vocabulary and sentence complexity the AI uses in every response
        </p>
        <AgeLevelSlider value={settings.ageLevel ?? 8} onChange={val => updateSetting('ageLevel', val)} />
      </div>

      <div className={styles.settingsCard}>
        <h3>Content Controls</h3>
        {[
          ['blockLinks', 'Block all links & URLs', "Agents won't send links, and any that appear won't be clickable"],
          ['blockVideo', 'Block video suggestions', "Agents won't suggest or reference YouTube or other videos"],
          ['blockImages', 'Block image suggestions', "Agents won't reference or suggest searching for images"],
        ].map(([key, label, desc]) => (
          <div key={key} className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>{label}</div>
              <div className={styles.settingDesc}>{desc}</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={!!settings[key]} onChange={e => updateSetting(key, e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
        <div className={styles.settingRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div className={styles.settingLabel}>Max response length (words)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={50} max={1000} step={50}
              value={settings.maxResponseLength ?? 300}
              onChange={e => updateSetting('maxResponseLength', parseInt(e.target.value))}
              style={{ width: 200 }} />
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{settings.maxResponseLength ?? 300} words</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <h3>Restricted Topics</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Toggle entire categories on/off</p>
        {settings.restrictedTopics.map(topic => (
          <div key={topic.id} className={styles.settingRow}>
            <div className={styles.settingLabel}>{topic.label}</div>
            <label className="toggle">
              <input type="checkbox" checked={topic.enabled} onChange={() => toggleTopic(topic.id)} />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>

      <div className={styles.settingsCard}>
        <h3>{isKidOverride ? 'Extra Blocked Words' : 'Blocked Words & Phrases'}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          {isKidOverride
            ? 'Added on top of the global blocked words list'
            : 'Blocked in both input and output across all agents'}
        </p>
        <div className={styles.wordCloud}>
          {(settings.blockedWords || []).map(word => (
            <span key={word} className={styles.wordTag}>
              {word}
              <button onClick={() => removeWord(word)} className={styles.wordRemove}>✕</button>
            </span>
          ))}
          {(settings.blockedWords || []).length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>None added</span>
          )}
        </div>
        <div className={styles.addWordRow}>
          <input className="input" value={newWord} onChange={e => setNewWord(e.target.value)}
            placeholder="Add word or phrase..." onKeyDown={e => e.key === 'Enter' && addWord()} />
          <button type="button" className="btn btn-primary" onClick={addWord}>Add</button>
        </div>
      </div>
    </div>
  );
}
