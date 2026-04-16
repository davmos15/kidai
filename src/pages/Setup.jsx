import { useState } from 'react';
import { DEFAULT_CONFIG, PRESET_AGENTS, saveConfig, generateId, DEFAULT_KID_SAFETY, hydratePreset, pickProviderForAgent } from '../utils/storage';
import SecretInput from '../components/SecretInput';
import styles from './Setup.module.css';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', color: '#e86f2c', docs: 'https://console.anthropic.com/', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI (GPT)', color: '#2c7be8', docs: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
  { id: 'gemini', name: 'Google Gemini', color: '#2a9d63', docs: 'https://aistudio.google.com/app/apikey', placeholder: 'AIza...' },
];

export default function Setup({ onComplete }) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [apiKeys, setApiKeys] = useState({ anthropic: '', openai: '', gemini: '' });
  const [kids, setKids] = useState([{ id: generateId(), name: '', emoji: '🧒', agentIds: [] }]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [error, setError] = useState('');

  const steps = ['Welcome', 'Parent PIN', 'API Keys', 'Add Kids', 'Choose Agents', 'Done'];

  // Jump to any step the user has already reached — forward or back.
  // Validation only runs when moving forward from the current step via "Next".
  const goToStep = (i) => {
    setError('');
    if (i <= maxReached) setStep(i);
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (pin.length < 4) return setError('PIN must be at least 4 digits');
      if (pin !== pinConfirm) return setError('PINs do not match');
    }
    if (step === 2) {
      const hasKey = Object.values(apiKeys).some(k => k.trim().length > 0);
      if (!hasKey) return setError('Please add at least one API key');
    }
    if (step === 3) {
      if (kids.some(k => !k.name.trim())) return setError('Please enter a name for each child');
    }
    setStep(s => {
      const next = s + 1;
      setMaxReached(m => Math.max(m, next));
      return next;
    });
  };

  const finish = () => {
    const config = {
      ...DEFAULT_CONFIG,
      parentPin: pin,
      apiKeys,
      kids: kids.map(k => ({ ...k, agentIds: selectedAgents, safety: { ...DEFAULT_KID_SAFETY } })),
      agents: PRESET_AGENTS
        .filter(a => selectedAgents.includes(a.id))
        .map(a => hydratePreset(a, apiKeys)),
      globalSettings: { ...DEFAULT_CONFIG.globalSettings, ageLevel: 8 },
    };
    saveConfig(config);
    onComplete(config);
  };

  const toggleAgent = (id) => {
    setSelectedAgents(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const addKid = () => setKids(prev => [...prev, { id: generateId(), name: '', emoji: '🧒', agentIds: [] }]);
  const updateKid = (id, field, val) => setKids(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k));
  const removeKid = (id) => setKids(prev => prev.filter(k => k.id !== id));

  const KID_EMOJIS = ['🧒', '👦', '👧', '👶', '🧑', '🌟', '🦄', '🐱', '🐶', '🦊'];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.steps}>
          {steps.map((s, i) => {
            const reachable = i <= maxReached;
            const clickable = reachable && i !== step;
            return (
              <button
                key={i}
                type="button"
                onClick={() => clickable && goToStep(i)}
                disabled={!clickable}
                className={`${styles.step} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''} ${clickable ? styles.stepClickable : ''}`}
                style={{ background: 'transparent', border: 'none', padding: 0 }}
                title={clickable ? `Go back to ${s}` : ''}
              >
                <div className={styles.stepDot}>{i < step ? '✓' : i + 1}</div>
                <span className={styles.stepLabel}>{s}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.body}>
          {step === 0 && (
            <div className={styles.welcome}>
              <div className={styles.bigEmoji}>🌟</div>
              <h1>Welcome to KidAI!</h1>
              <p>Let's set up a safe AI experience for your family in just a few steps.</p>
              <ul className={styles.features}>
                <li>🔒 Your data stays on <strong>your device</strong></li>
                <li>🤖 Connect your own AI API keys</li>
                <li>👨‍👩‍👧 Multiple kids, multiple agents</li>
                <li>🛡️ You control what's allowed</li>
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className={styles.section}>
              <h2>Set a Parent PIN</h2>
              <p>This PIN protects the parent dashboard. Kids won't be able to access settings.</p>
              <div className={styles.field}>
                <label>Create PIN (4+ digits)</label>
                <SecretInput inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={8} />
              </div>
              <div className={styles.field}>
                <label>Confirm PIN</label>
                <SecretInput inputMode="numeric" value={pinConfirm} onChange={e => setPinConfirm(e.target.value)} placeholder="••••" maxLength={8} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.section}>
              <h2>Connect API Keys</h2>
              <p>Add at least one API key. Keys are stored locally on this device only.</p>
              {PROVIDERS.map(p => (
                <div key={p.id} className={styles.providerCard}>
                  <div className={styles.providerHeader} style={{ borderColor: p.color }}>
                    <span className={styles.providerName}>{p.name}</span>
                    <a href={p.docs} target="_blank" rel="noopener noreferrer" className={styles.docsLink} onClick={e => e.stopPropagation()}>
                      Get API Key →
                    </a>
                  </div>
                  <SecretInput value={apiKeys[p.id]} onChange={e => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder={p.placeholder} />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className={styles.section}>
              <h2>Add Your Kids</h2>
              <p>Add each child who will use KidAI. You can change this later.</p>
              {kids.map((kid, i) => (
                <div key={kid.id} className={styles.kidRow}>
                  <select className={`input ${styles.emojiSelect}`} value={kid.emoji} onChange={e => updateKid(kid.id, 'emoji', e.target.value)}>
                    {KID_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input
                    className="input"
                    value={kid.name}
                    onChange={e => updateKid(kid.id, 'name', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && kid.name.trim()) { e.preventDefault(); nextStep(); } }}
                    placeholder={`Child ${i + 1}'s name`}
                    style={{ flex: 1 }}
                    autoFocus={i === 0}
                  />
                  {kids.length > 1 && (
                    <button className="btn btn-danger" onClick={() => removeKid(kid.id)} style={{ padding: '10px 14px' }}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn btn-secondary" onClick={addKid} style={{ marginTop: 8, width: '100%' }}>+ Add Another Child</button>
            </div>
          )}

          {step === 4 && (() => {
            const pick = pickProviderForAgent(apiKeys);
            return (
              <div className={styles.section}>
                <h2>Choose AI Agents</h2>
                <p>Pick which companions your kids can chat with. All agents run on whichever AI provider you have a key for — you can switch providers per-agent later.</p>
                {pick ? (
                  <div style={{ fontSize: 13, color: 'var(--green)', background: 'var(--green-light)', padding: '8px 12px', borderRadius: 10, marginBottom: 12, fontWeight: 600 }}>
                    ✓ Using <strong>{pick.provider}</strong> by default ({pick.model})
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-light)', padding: '8px 12px', borderRadius: 10, marginBottom: 12, fontWeight: 600 }}>
                    ⚠️ No API key set — go back to step 3 and add one
                  </div>
                )}
                <div className={styles.agentGrid}>
                  {PRESET_AGENTS.map(agent => {
                    const selected = selectedAgents.includes(agent.id);
                    const disabled = !pick;
                    return (
                      <button key={agent.id} className={`${styles.agentCard} ${selected ? styles.agentSelected : ''} ${disabled ? styles.agentDisabled : ''}`}
                        onClick={() => !disabled && toggleAgent(agent.id)}
                        style={{ '--agent-color': agent.color }}
                      >
                        <span className={styles.agentEmoji}>{agent.emoji}</span>
                        <span className={styles.agentName}>{agent.name}</span>
                        <span className={styles.agentDesc}>{agent.description}</span>
                        {selected && <span className={styles.agentCheck}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {step === 5 && (
            <div className={styles.welcome}>
              <div className={styles.bigEmoji}>🎉</div>
              <h1>All set!</h1>
              <p>KidAI is ready for your family. You can always change settings from the Parent Dashboard.</p>
              <div className={styles.summary}>
                <div className={styles.summaryRow}><span>👨‍👩‍👧 Kids:</span><strong>{kids.map(k => k.name).join(', ')}</strong></div>
                <div className={styles.summaryRow}><span>🤖 Agents:</span><strong>{selectedAgents.length} selected</strong></div>
                <div className={styles.summaryRow}><span>🔑 API Keys:</span><strong>{Object.values(apiKeys).filter(k => k).length} connected</strong></div>
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            {step > 0 && step < 5 && (
              <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            {step < 5 ? (
              <button className="btn btn-primary" onClick={nextStep} style={{ marginLeft: 'auto' }}>
                {step === 4 ? 'Finish Setup' : 'Next →'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={finish} style={{ margin: '0 auto' }}>
                Enter KidAI 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
