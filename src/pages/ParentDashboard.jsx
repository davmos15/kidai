import { useState, useRef } from 'react';
import { saveConfig, loadChats, exportChats, exportConfig, exportConfigWithKeys, importConfig, generateId, PRESET_AGENTS, AGE_LEVELS, DEFAULT_KID_SAFETY } from '../utils/storage';
import styles from './ParentDashboard.module.css';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', placeholder: 'sk-ant-...', docs: 'https://console.anthropic.com/' },
  { id: 'openai', name: 'OpenAI (GPT)', placeholder: 'sk-...', docs: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...', docs: 'https://aistudio.google.com/app/apikey' },
];

const MODELS = {
  anthropic: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
};

const KID_EMOJIS = ['🧒', '👦', '👧', '👶', '🧑', '🌟', '🦄', '🐱', '🐶', '🐸', '🦊', '🐼'];

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

function SafetyPanel({ settings, onChange, isKidOverride = false }) {
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
          <button className="btn btn-primary" onClick={addWord}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ParentDashboard({ config, onSave, onBack }) {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(!config?.parentPin);
  const [tab, setTab] = useState('kids');
  const [cfg, setCfg] = useState(config);
  const [saved, setSaved] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [viewingChatsKid, setViewingChatsKid] = useState(null);
  const [chats, setChats] = useState([]);
  const [newKidName, setNewKidName] = useState('');
  const [newKidEmoji, setNewKidEmoji] = useState('🧒');
  const [pinError, setPinError] = useState('');
  const [expandedKidSafety, setExpandedKidSafety] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [showFullExportWarning, setShowFullExportWarning] = useState(false);
  const importRef = useRef(null);

  const unlock = () => {
    if (pinInput === cfg.parentPin) { setUnlocked(true); setPinError(''); }
    else setPinError('Incorrect PIN');
  };

  const save = (newCfg = cfg) => {
    saveConfig(newCfg);
    onSave(newCfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCfg = (updater) => setCfg(prev => updater(prev));

  const updateSetting = (key, val) =>
    updateCfg(prev => ({ ...prev, globalSettings: { ...prev.globalSettings, [key]: val } }));

  const updateGlobalSafety = (newSettings) =>
    updateCfg(prev => ({ ...prev, globalSettings: { ...prev.globalSettings, ...newSettings } }));

  const addKid = () => {
    if (!newKidName.trim()) return;
    const kid = {
      id: generateId(),
      name: newKidName.trim(),
      emoji: newKidEmoji,
      agentIds: cfg.agents.map(a => a.id),
      safety: { ...DEFAULT_KID_SAFETY },
    };
    updateCfg(prev => ({ ...prev, kids: [...prev.kids, kid] }));
    setNewKidName(''); setNewKidEmoji('🧒');
  };

  const removeKid = (id) => updateCfg(prev => ({ ...prev, kids: prev.kids.filter(k => k.id !== id) }));

  const toggleKidAgent = (kidId, agentId) => {
    updateCfg(prev => ({
      ...prev,
      kids: prev.kids.map(k => k.id === kidId
        ? { ...k, agentIds: k.agentIds.includes(agentId) ? k.agentIds.filter(a => a !== agentId) : [...k.agentIds, agentId] }
        : k),
    }));
  };

  const updateKidSafety = (kidId, newSafety) => {
    updateCfg(prev => ({
      ...prev,
      kids: prev.kids.map(k => k.id === kidId ? { ...k, safety: newSafety } : k),
    }));
  };

  const addPresetAgent = (preset) => {
    if (cfg.agents.find(a => a.id === preset.id)) return;
    updateCfg(prev => ({ ...prev, agents: [...prev.agents, { ...preset }] }));
  };

  const removeAgent = (id) => {
    updateCfg(prev => ({
      ...prev,
      agents: prev.agents.filter(a => a.id !== id),
      kids: prev.kids.map(k => ({ ...k, agentIds: k.agentIds.filter(a => a !== id) })),
    }));
  };

  const saveAgent = (agent) => {
    updateCfg(prev => {
      const exists = prev.agents.find(a => a.id === agent.id);
      return {
        ...prev,
        agents: exists ? prev.agents.map(a => a.id === agent.id ? agent : a) : [...prev.agents, agent],
      };
    });
    setEditingAgent(null);
  };

  const viewChats = (kid) => {
    setChats(loadChats(kid.id));
    setViewingChatsKid(kid);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('loading');
    try {
      const parsed = await importConfig(file);
      const merged = {
        ...parsed,
        apiKeys: {
          anthropic: parsed.apiKeys?.anthropic || cfg.apiKeys?.anthropic || '',
          openai: parsed.apiKeys?.openai || cfg.apiKeys?.openai || '',
          gemini: parsed.apiKeys?.gemini || cfg.apiKeys?.gemini || '',
        },
      };
      setCfg(merged);
      saveConfig(merged);
      onSave(merged);
      setImportStatus('success');
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      setImportStatus(`error:${err.message}`);
      setTimeout(() => setImportStatus(''), 5000);
    }
    e.target.value = '';
  };

  // ── Lock screen ──────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className={styles.lockPage}>
        <div className={styles.lockCard}>
          <div className={styles.lockIcon}>🔒</div>
          <h2>Parent Dashboard</h2>
          <p>Enter your PIN to continue</p>
          <input className="input" type="password" inputMode="numeric" value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            placeholder="••••" style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }} autoFocus />
          {pinError && <div className={styles.pinError}>{pinError}</div>}
          <button className="btn btn-primary" onClick={unlock} style={{ width: '100%' }}>Unlock →</button>
          <button className="btn btn-ghost" onClick={onBack} style={{ width: '100%', marginTop: 4 }}>← Back</button>
        </div>
      </div>
    );
  }

  if (editingAgent) return <AgentEditor agent={editingAgent} apiKeys={cfg.apiKeys} onSave={saveAgent} onCancel={() => setEditingAgent(null)} />;
  if (viewingChatsKid) return <ChatViewer kid={viewingChatsKid} chats={chats} onBack={() => setViewingChatsKid(null)} onExport={() => exportChats(viewingChatsKid.id, viewingChatsKid.name)} />;

  // ── Main dashboard ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div className={styles.headerTitle}>
          <span>⚙️</span>
          <h1>Parent Dashboard</h1>
        </div>
        <button className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`} onClick={() => save()}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className={styles.layout}>
        <nav className={styles.nav}>
          {[
            ['kids', '👨‍👩‍👧', 'Kids'],
            ['agents', '🤖', 'Agents'],
            ['safety', '🛡️', 'Safety'],
            ['keys', '🔑', 'API Keys'],
            ['chats', '💬', 'Chat History'],
            ['backup', '💾', 'Backup'],
          ].map(([id, emoji, label]) => (
            <button key={id} className={`${styles.navItem} ${tab === id ? styles.navActive : ''}`} onClick={() => setTab(id)}>
              <span>{emoji}</span> {label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>

          {/* ── KIDS ── */}
          {tab === 'kids' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>Kids</h2>
                <p>Manage children, agent access, and per-kid safety settings</p>
              </div>

              {cfg.kids.map(kid => {
                const kidSafety = kid.safety || { ...DEFAULT_KID_SAFETY };
                const isExpanded = expandedKidSafety === kid.id;
                const ageLevelObj = AGE_LEVELS.find(l => l.age === (kidSafety.useGlobal ? cfg.globalSettings.ageLevel : kidSafety.ageLevel)) || AGE_LEVELS[2];

                return (
                  <div key={kid.id} className={styles.kidCard}>
                    <div className={styles.kidHeader}>
                      <span className={styles.kidEmoji}>{kid.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div className={styles.kidName}>{kid.name}</div>
                        <div className={styles.kidSub}>
                          {kid.agentIds.length} agent(s) ·{' '}
                          <span className={`${styles.safetyBadge} ${kidSafety.useGlobal ? styles.safetyBadgeGlobal : styles.safetyBadgeCustom}`}>
                            {kidSafety.useGlobal ? '🌐 Global safety' : `✏️ Custom · ${ageLevelObj.label}`}
                          </span>
                        </div>
                      </div>
                      <div className={styles.kidActions}>
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => viewChats(kid)}>Chats</button>
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }}
                          onClick={() => setExpandedKidSafety(isExpanded ? null : kid.id)}>
                          {isExpanded ? 'Close ▲' : '⚙️ Settings ▼'}
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => removeKid(kid.id)}>✕</button>
                      </div>
                    </div>

                    <div className={styles.kidAgents}>
                      <div className={styles.kidAgentsLabel}>Assigned agents:</div>
                      <div className={styles.kidAgentsList}>
                        {cfg.agents.map(agent => (
                          <button key={agent.id}
                            className={`${styles.agentChip} ${kid.agentIds.includes(agent.id) ? styles.agentChipOn : ''}`}
                            onClick={() => toggleKidAgent(kid.id, agent.id)}>
                            {agent.emoji} {agent.name}
                          </button>
                        ))}
                        {cfg.agents.length === 0 && <span className={styles.noAgents}>No agents yet — add some in the Agents tab</span>}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.kidSafetyPanel}>
                        <div className={styles.kidSafetyHeader}>
                          <h4>⚙️ Individual Settings for {kid.name}</h4>
                          <label className={styles.useGlobalToggle}>
                            <label className="toggle">
                              <input type="checkbox" checked={kidSafety.useGlobal}
                                onChange={e => updateKidSafety(kid.id, { ...kidSafety, useGlobal: e.target.checked })} />
                              <span className="toggle-slider" />
                            </label>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Use global settings</span>
                          </label>
                        </div>

                        {kidSafety.useGlobal ? (
                          <div className={styles.globalInheritNote}>
                            <span style={{ fontSize: 20 }}>✓</span>
                            <div>
                              <strong>{kid.name}</strong> inherits all settings from the Global Safety tab — including reading level, blocked topics, and content controls. Disable "Use global settings" above to customise individually.
                            </div>
                          </div>
                        ) : (
                          <SafetyPanel
                            settings={kidSafety}
                            onChange={(newS) => updateKidSafety(kid.id, { ...newS, useGlobal: false })}
                            isKidOverride={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={styles.addCard}>
                <h3>Add a Child</h3>
                <div className={styles.addKidRow}>
                  <select className={`input ${styles.emojiSelect}`} value={newKidEmoji} onChange={e => setNewKidEmoji(e.target.value)}>
                    {KID_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input className="input" value={newKidName} onChange={e => setNewKidName(e.target.value)}
                    placeholder="Child's name" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addKid()} />
                  <button className="btn btn-primary" onClick={addKid}>Add</button>
                </div>
              </div>
            </div>
          )}

          {/* ── AGENTS ── */}
          {tab === 'agents' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>AI Agents</h2>
                <p>Create and customise the AI personalities your kids can chat with</p>
              </div>
              <div className={styles.agentGrid}>
                {cfg.agents.map(agent => (
                  <div key={agent.id} className={styles.agentCard} style={{ '--c': agent.color }}>
                    <div className={styles.agentTop}>
                      <span className={styles.agentEmoji}>{agent.emoji}</span>
                      <div>
                        <div className={styles.agentName}>{agent.name}</div>
                        <div className={styles.agentProvider}>{agent.provider} · {agent.model}</div>
                      </div>
                    </div>
                    <p className={styles.agentDesc}>{agent.description}</p>
                    <div className={styles.agentButtons}>
                      <button className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }} onClick={() => setEditingAgent(agent)}>Edit</button>
                      <button className="btn btn-danger" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => removeAgent(agent.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <button className={styles.addAgentBtn}
                  onClick={() => setEditingAgent({ id: generateId(), name: '', emoji: '🤖', color: '#e86f2c', description: '', systemPrompt: '', provider: 'anthropic', model: 'claude-3-haiku-20240307' })}>
                  <span style={{ fontSize: 32 }}>+</span>
                  <span style={{ fontWeight: 700 }}>Create Custom Agent</span>
                </button>
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: 32 }}>
                <h3>Add Preset Agents</h3>
                <p>Quick-add pre-configured agents</p>
              </div>
              <div className={styles.presetGrid}>
                {PRESET_AGENTS.filter(p => !cfg.agents.find(a => a.id === p.id)).map(preset => {
                  const hasKey = cfg.apiKeys[preset.provider]?.trim().length > 0;
                  return (
                    <button key={preset.id} className={`${styles.presetCard} ${!hasKey ? styles.presetDisabled : ''}`}
                      onClick={() => hasKey && addPresetAgent(preset)}>
                      <span>{preset.emoji}</span><span>{preset.name}</span>
                      {!hasKey && <span className={styles.noKey}>Needs {preset.provider} key</span>}
                    </button>
                  );
                })}
                {PRESET_AGENTS.filter(p => !cfg.agents.find(a => a.id === p.id)).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All preset agents have been added!</p>
                )}
              </div>
            </div>
          )}

          {/* ── SAFETY ── */}
          {tab === 'safety' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>Global Safety Settings</h2>
                <p>Applies to all kids unless a child has custom settings enabled</p>
              </div>
              <SafetyPanel settings={cfg.globalSettings} onChange={updateGlobalSafety} />
              <div className={styles.settingsCard} style={{ marginTop: 16 }}>
                <h3>Chat History Storage</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>How should chat history be saved for parent review?</p>
                {[
                  ['local', '💾 Device Storage (localStorage)', 'Chats are stored in this browser. Easy to access, but device-specific.'],
                  ['export', '📥 Manual Export Only', 'No automatic saving — parents export chats on demand from the Chat History tab.'],
                ].map(([val, label, desc]) => (
                  <label key={val} className={styles.radioRow}>
                    <input type="radio" name="chatStorage" value={val}
                      checked={cfg.globalSettings.chatStorage === val}
                      onChange={() => updateSetting('chatStorage', val)} />
                    <div>
                      <div className={styles.settingLabel}>{label}</div>
                      <div className={styles.settingDesc}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── API KEYS ── */}
          {tab === 'keys' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>API Keys</h2>
                <p>Keys are stored locally on this device only — never sent anywhere else</p>
              </div>
              {PROVIDERS.map(p => (
                <div key={p.id} className={styles.keyCard}>
                  <div className={styles.keyHeader}>
                    <div className={styles.keyName}>{p.name}</div>
                    <a href={p.docs} target="_blank" rel="noopener noreferrer" className={styles.docsLink}>Get API Key →</a>
                  </div>
                  <input className="input" type="password" value={cfg.apiKeys[p.id] || ''}
                    onChange={e => updateCfg(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [p.id]: e.target.value } }))}
                    placeholder={p.placeholder} />
                  {cfg.apiKeys[p.id] && <div className={styles.keyStatus}>✓ Key entered</div>}
                </div>
              ))}
              <div className={styles.keyNote}>
                🔒 API keys are only stored in your browser's localStorage. They are never transmitted to any server other than the respective AI provider when making chat requests.
              </div>
            </div>
          )}

          {/* ── CHAT HISTORY ── */}
          {tab === 'chats' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>Chat History</h2>
                <p>Review your children's conversations with their AI agents</p>
              </div>
              {cfg.kids.length === 0 ? <div className={styles.empty}>No kids added yet</div> : (
                cfg.kids.map(kid => {
                  const kidChats = loadChats(kid.id);
                  return (
                    <div key={kid.id} className={styles.kidChatCard}>
                      <div className={styles.kidChatHeader}>
                        <span style={{ fontSize: 28 }}>{kid.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div className={styles.kidName}>{kid.name}</div>
                          <div className={styles.kidSub}>{kidChats.length} messages stored</div>
                        </div>
                        <div className={styles.kidActions}>
                          <button className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => viewChats(kid)}>View</button>
                          <button className="btn btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => exportChats(kid.id, kid.name)}>Export JSON</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── BACKUP ── */}
          {tab === 'backup' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2>Backup & Restore</h2>
                <p>Export your KidAI config to restore it on another device or after clearing your browser</p>
              </div>

              <div className={styles.backupGrid}>
                <div className={styles.backupCard}>
                  <div className={styles.backupIcon}>📤</div>
                  <h3>Export Config (Safe)</h3>
                  <p>Downloads all settings, kids, and agents. <strong>API keys are not included</strong> — you'll re-enter them after restoring.</p>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => exportConfig(cfg)}>
                    Download Backup
                  </button>
                </div>

                <div className={styles.backupCard}>
                  <div className={styles.backupIcon}>🔑</div>
                  <h3>Export with API Keys</h3>
                  <p>Includes API keys in the file. <strong>Keep this private</strong> — anyone with it can use your keys.</p>
                  {showFullExportWarning ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                      <div className={styles.keyWarningBox}>⚠️ This file contains your API keys. Store it safely and don't share it.</div>
                      <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => { exportConfigWithKeys(cfg); setShowFullExportWarning(false); }}>
                        Yes, download with keys
                      </button>
                      <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setShowFullExportWarning(false)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setShowFullExportWarning(true)}>
                      Download Full Backup
                    </button>
                  )}
                </div>

                <div className={styles.backupCard}>
                  <div className={styles.backupIcon}>📥</div>
                  <h3>Restore from Backup</h3>
                  <p>Upload a previously exported KidAI backup. Current settings are replaced. Existing API keys are preserved unless the backup includes them.</p>
                  <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                  {importStatus === 'loading' && <div className={styles.importStatus} style={{ background: 'var(--yellow-light)', color: '#7a5a00', borderColor: 'var(--yellow)' }}>⏳ Importing...</div>}
                  {importStatus === 'success' && <div className={styles.importStatus} style={{ background: 'var(--green-light)', color: 'var(--green)', borderColor: 'var(--green)' }}>✓ Config restored successfully!</div>}
                  {importStatus.startsWith('error:') && <div className={styles.importStatus} style={{ background: 'var(--red-light)', color: 'var(--red)', borderColor: 'var(--red)' }}>⚠️ {importStatus.slice(6)}</div>}
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => importRef.current?.click()}>
                    Choose Backup File
                  </button>
                </div>
              </div>

              <div className={styles.settingsCard} style={{ marginTop: 8 }}>
                <h3>⚠️ Clear All Data</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Permanently deletes all KidAI data from this browser including config and all chat history. Cannot be undone — export a backup first!
                </p>
                <button className="btn btn-danger" onClick={() => {
                  if (window.confirm('Delete ALL KidAI data from this browser? This cannot be undone.')) {
                    Object.keys(localStorage).filter(k => k.startsWith('kidai')).forEach(k => localStorage.removeItem(k));
                    window.location.reload();
                  }
                }}>
                  Clear All KidAI Data
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Agent Editor ──────────────────────────────────────────────────────────────

function AgentEditor({ agent, apiKeys, onSave, onCancel }) {
  const [a, setA] = useState(agent);
  const AGENT_EMOJIS = ['🤖', '🦉', '🧙', '🦄', '🐙', '🦕', '🌈', '🔬', '📚', '🎮', '🎨', '🎵', '⭐', '🚀', '🐱', '🐶'];
  const COLORS = ['#e86f2c', '#2c7be8', '#2a9d63', '#e8a62c', '#7c4de8', '#d94f3d', '#1a9bba'];
  const hasKey = apiKeys[a.provider]?.trim().length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={onCancel}>← Cancel</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{agent.name ? `Edit: ${agent.name}` : 'New Agent'}</h2>
        <button className="btn btn-primary" onClick={() => onSave(a)} disabled={!a.name || !a.systemPrompt || !hasKey}>
          Save Agent
        </button>
      </div>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className={styles.settingsCard}>
          <h3>Identity</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <select className={`input ${styles.emojiSelect}`} value={a.emoji} onChange={e => setA(p => ({ ...p, emoji: e.target.value }))}>
              {AGENT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input className="input" value={a.name} onChange={e => setA(p => ({ ...p, name: e.target.value }))} placeholder="Agent name" style={{ flex: 1 }} />
          </div>
          <input className="input" value={a.description} onChange={e => setA(p => ({ ...p, description: e.target.value }))} placeholder="Short description" style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setA(p => ({ ...p, color: c }))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: a.color === c ? '3px solid #1a1208' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div className={styles.settingsCard}>
          <h3>AI Model</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <select className="input" value={a.provider} onChange={e => setA(p => ({ ...p, provider: e.target.value, model: MODELS[e.target.value][0] }))}>
              {['anthropic', 'openai', 'gemini'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input" value={a.model} onChange={e => setA(p => ({ ...p, model: e.target.value }))}>
              {(MODELS[a.provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {!hasKey && <div className={styles.keyWarning}>⚠️ No API key for {a.provider} — add one in API Keys</div>}
        </div>
        <div className={styles.settingsCard}>
          <h3>System Prompt</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Define personality. Safety rules and reading level are automatically appended.</p>
          <textarea className="input" value={a.systemPrompt} onChange={e => setA(p => ({ ...p, systemPrompt: e.target.value }))}
            placeholder="You are a friendly AI tutor for kids..." rows={8} style={{ resize: 'vertical', lineHeight: 1.6 }} />
        </div>
      </div>
    </div>
  );
}

// ── Chat Viewer ───────────────────────────────────────────────────────────────

function ChatViewer({ kid, chats, onBack, onExport }) {
  const sessions = {};
  chats.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString();
    if (!sessions[date]) sessions[date] = [];
    sessions[date].push(msg);
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{kid.emoji} {kid.name}'s Chats</h2>
        <button className="btn btn-secondary" onClick={onExport}>Export JSON</button>
      </div>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {Object.keys(sessions).length === 0 ? (
          <div className={styles.empty}>No chats yet</div>
        ) : (
          Object.entries(sessions).reverse().map(([date, msgs]) => (
            <div key={date} className={styles.chatSession}>
              <div className={styles.chatDate}>{date}</div>
              {msgs.map((msg, i) => (
                <div key={i} className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatUser : styles.chatAgent}`}>
                  <span className={styles.chatRole}>{msg.role === 'user' ? kid.name : msg.agentName || 'Agent'}</span>
                  <span className={styles.chatText}>{msg.content}</span>
                  <span className={styles.chatTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
