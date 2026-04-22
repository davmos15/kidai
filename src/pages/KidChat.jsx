import { useState, useRef, useEffect } from 'react';
import {
  callAI, buildSafetySystemPrompt, filterResponse,
  loadSessions, loadSessionMessages, appendChats, deleteSession,
  resolveKidSettings, sanitizeInput, detectPersonalInfo,
  getDailyCount, incrementDailyCount, generateId,
} from '../utils/storage';
import MessageContent from '../components/MessageContent';
import styles from './KidChat.module.css';

const PII_MESSAGES = {
  phone: "Let's not share phone numbers here — ask me something else!",
  email: "We don't share email addresses in chat. Try a different question!",
  card: "That looks like a long number we shouldn't share. Ask me something else!",
};

function greet(kidName, agent, useEmojis) {
  return useEmojis
    ? `Hi ${kidName}! 👋 I'm ${agent.name} ${agent.emoji} — I'm so excited to chat with you today! What would you like to explore?`
    : `Hi ${kidName}, I'm ${agent.name}. I'm excited to chat with you today. What would you like to explore?`;
}

function formatSessionTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function KidChat({ config, kid, agent, onBack }) {
  const agents = config.agents.filter(a => kid.agentIds.includes(a.id));
  const [currentAgent, setCurrentAgent] = useState(agent);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [dailyCount, setDailyCount] = useState(() => getDailyCount(kid.id));
  const [sessionId, setSessionId] = useState(() => generateId());
  const [sessions, setSessions] = useState(() => loadSessions(kid.id));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  // Set to true when we're programmatically loading a resumed session;
  // the agent-changed useEffect respects this and skips resetting messages.
  const suppressGreetingReset = useRef(false);

  const settings = resolveKidSettings(kid, config.globalSettings);
  const apiKey = config.apiKeys[currentAgent.provider];
  const limitReached = settings.dailyMessageLimit > 0 && dailyCount >= settings.dailyMessageLimit;
  const useEmojis = settings.useEmojis !== false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When the agent changes (either on mount, via picker, or after resuming a
  // different session), reset the visible conversation to a fresh greeting
  // — unless the resume flow has explicitly asked us to keep the messages
  // it just loaded.
  useEffect(() => {
    if (suppressGreetingReset.current) {
      suppressGreetingReset.current = false;
      return;
    }
    setMessages([{
      role: 'assistant',
      content: greet(kid.name, currentAgent, useEmojis),
      timestamp: Date.now(),
      agentName: currentAgent.name,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgent]);

  const isBlocked = (text) => {
    const lower = text.toLowerCase();
    return settings.blockedWords.some(w => lower.includes(w.toLowerCase()));
  };

  const newChat = () => {
    setSessionId(generateId());
    setMessages([{
      role: 'assistant',
      content: greet(kid.name, currentAgent, useEmojis),
      timestamp: Date.now(),
      agentName: currentAgent.name,
    }]);
    setError('');
    setSidebarOpen(false);
  };

  const resumeSession = (session) => {
    const msgs = loadSessionMessages(kid.id, session.id);
    if (!msgs.length) return;
    const sessionAgent = agents.find(a => a.name === session.agentName);
    if (sessionAgent && sessionAgent.id !== currentAgent.id) {
      // Tell the greeting-reset useEffect to stand down for this change.
      suppressGreetingReset.current = true;
      setCurrentAgent(sessionAgent);
    }
    setSessionId(session.id);
    setMessages(msgs);
    setError('');
    setSidebarOpen(false);
  };

  const removeSession = (session, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this chat? It can't be undone.`)) return;
    deleteSession(kid.id, session.id);
    setSessions(loadSessions(kid.id));
    if (session.id === sessionId) newChat();
  };

  const send = async () => {
    const trimmed = sanitizeInput(input);
    if (!trimmed || loading) return;

    if (limitReached) {
      setError("You've used today's chats — see you tomorrow!");
      return;
    }

    if (isBlocked(trimmed)) {
      setError("Oops! That's not something we can talk about. Try asking something else!");
      setInput('');
      return;
    }

    if (settings.protectPersonalInfo) {
      const kind = detectPersonalInfo(trimmed);
      if (kind) {
        setError(PII_MESSAGES[kind]);
        setInput('');
        return;
      }
    }

    setError('');
    const userMsg = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      sessionId,
      agentName: currentAgent.name,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const newCount = incrementDailyCount(kid.id);
    setDailyCount(newCount);

    try {
      const systemPrompt = buildSafetySystemPrompt(currentAgent, settings, kid.name);
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const raw = await callAI(currentAgent.provider, currentAgent.model, apiKey, apiMessages, systemPrompt);
      const filtered = filterResponse(raw, settings);

      const assistantMsg = {
        role: 'assistant',
        content: filtered,
        timestamp: Date.now(),
        sessionId,
        agentName: currentAgent.name,
      };

      const withReply = [...newMessages, assistantMsg];

      let finalMessages = withReply;
      const every = settings.breakReminderEvery || 0;
      if (every > 0 && newCount > 0 && newCount % every === 0) {
        const breakMsg = {
          role: 'assistant',
          kind: 'break-reminder',
          content: useEmojis
            ? `🌈 Time for a quick break, ${kid.name}! Stretch, drink some water, look out the window — then come back whenever you're ready.`
            : `Time for a quick break, ${kid.name}. Stretch, drink some water, look out the window, then come back when you're ready.`,
          timestamp: Date.now() + 1,
          agentName: 'Break reminder',
        };
        finalMessages = [...withReply, breakMsg];
      }

      setMessages(finalMessages);

      // Persist only the real user+assistant messages — break reminders stay
      // UI-only so they don't clutter exports.
      if (settings.chatStorage === 'local') {
        appendChats(kid.id, [userMsg, assistantMsg]);
        setSessions(loadSessions(kid.id));
      }
    } catch (e) {
      setError(`Something went wrong: ${e.message}. Please try again!`);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const preRenderText = (text) => {
    if (!text) return '';
    if (!settings.blockLinks) return text;
    return text.replace(/https?:\/\/[^\s]+/g, '[link]').replace(/www\.[^\s]+/g, '[link]');
  };

  return (
    <div className={styles.page} data-font-size={settings.fontSize || 'normal'}>
      {/* ── Sidebar (desktop rail + mobile drawer) ─────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>💬 Chats</span>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <button className={styles.newChatBtn} onClick={newChat}>
          + New chat
        </button>
        <div className={styles.sessionList}>
          {sessions.length === 0 && (
            <div className={styles.sessionEmpty}>No past chats yet — send a message to start one!</div>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              className={`${styles.sessionItem} ${s.id === sessionId ? styles.sessionItemActive : ''}`}
              onClick={() => resumeSession(s)}
            >
              <div className={styles.sessionTitle}>{s.title || 'New chat'}</div>
              <div className={styles.sessionMeta}>
                <span>{s.agentName || 'Agent'}</span>
                <span>· {formatSessionTime(s.lastAt)}</span>
              </div>
              <button
                className={styles.sessionDelete}
                onClick={(e) => removeSession(s, e)}
                title="Delete chat"
                aria-label="Delete chat"
              >🗑</button>
            </button>
          ))}
        </div>
      </aside>

      {sidebarOpen && <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />}

      <div className={styles.main}>
        <div className={styles.header}>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(true)} aria-label="Open chats">☰</button>
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">←</button>
          <button className={styles.agentInfo} onClick={() => agents.length > 1 && setShowAgentPicker(true)}>
            <span className={styles.agentEmoji}>{currentAgent.emoji}</span>
            <div>
              <div className={styles.agentName}>{currentAgent.name}</div>
              <div className={styles.agentDesc}>{currentAgent.description}</div>
            </div>
            {agents.length > 1 && <span className={styles.switchHint}>Switch ▾</span>}
          </button>
          <div className={styles.kidBadge}>{kid.emoji} {kid.name}</div>
        </div>

        {showAgentPicker && (
          <div className={styles.agentPickerOverlay} onClick={() => setShowAgentPicker(false)}>
            <div className={styles.agentPicker} onClick={e => e.stopPropagation()}>
              <h3>Switch Agent</h3>
              {agents.map(a => (
                <button key={a.id} className={`${styles.agentPickerItem} ${a.id === currentAgent.id ? styles.agentPickerActive : ''}`}
                  onClick={() => { setCurrentAgent(a); setShowAgentPicker(false); newChat(); }}>
                  <span style={{ fontSize: 28 }}>{a.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.description}</div>
                  </div>
                  {a.id === currentAgent.id && <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.messages}>
          {messages.map((msg, i) => {
            if (msg.kind === 'break-reminder') {
              return (
                <div key={i} className={styles.breakReminder}>
                  <div className={styles.breakReminderText}>{msg.content}</div>
                </div>
              );
            }
            return (
              <div key={i} className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAgent}`}>
                {msg.role === 'assistant' && (
                  <div className={styles.bubbleAgent_emoji}>{currentAgent.emoji}</div>
                )}
                <div className={`${styles.bubbleContent} ${msg.role === 'user' ? styles.bubbleContentUser : styles.bubbleContentAgent}`}
                  style={msg.role === 'assistant' ? { '--agent-color': currentAgent.color } : {}}>
                  <div className={styles.bubbleText}>
                    {msg.role === 'user'
                      ? msg.content
                      : <MessageContent text={preRenderText(msg.content)} />}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className={styles.bubble}>
              <div className={styles.bubbleAgent_emoji}>{currentAgent.emoji}</div>
              <div className={`${styles.bubbleContent} ${styles.bubbleContentAgent}`} style={{ '--agent-color': currentAgent.color }}>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorBubble}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={limitReached ? "You've used today's chats — see you tomorrow!" : `Ask ${currentAgent.name} anything...`}
            rows={1}
            maxLength={500}
            disabled={limitReached}
          />
          <button className={styles.sendBtn} onClick={send} disabled={!input.trim() || loading || limitReached}
            style={{ background: currentAgent.color }}>
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
