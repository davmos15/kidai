import { useState, useRef, useEffect } from 'react';
import { callAI, buildSafetySystemPrompt, filterResponse, loadChats, saveChats, resolveKidSettings, sanitizeInput, detectPersonalInfo, getDailyCount, incrementDailyCount } from '../utils/storage';
import styles from './KidChat.module.css';

const PII_MESSAGES = {
  phone: "Let's not share phone numbers here — ask me something else!",
  email: "We don't share email addresses in chat. Try a different question!",
  card: "That looks like a long number we shouldn't share. Ask me something else!",
};

export default function KidChat({ config, kid, agent, onBack }) {
  const agents = config.agents.filter(a => kid.agentIds.includes(a.id));
  const [currentAgent, setCurrentAgent] = useState(agent);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [dailyCount, setDailyCount] = useState(() => getDailyCount(kid.id));
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const settings = resolveKidSettings(kid, config.globalSettings);
  const apiKey = config.apiKeys[currentAgent.provider];
  const limitReached = settings.dailyMessageLimit > 0 && dailyCount >= settings.dailyMessageLimit;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const useEmojis = settings.useEmojis !== false;
    const greeting = useEmojis
      ? `Hi ${kid.name}! 👋 I'm ${currentAgent.name} ${currentAgent.emoji} — I'm so excited to chat with you today! What would you like to explore?`
      : `Hi ${kid.name}, I'm ${currentAgent.name}. I'm excited to chat with you today. What would you like to explore?`;
    setMessages([{
      role: 'assistant',
      content: greeting,
      timestamp: Date.now(),
      agentName: currentAgent.name,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgent]);

  const isBlocked = (text) => {
    const lower = text.toLowerCase();
    return settings.blockedWords.some(w => lower.includes(w.toLowerCase()));
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
    const userMsg = { role: 'user', content: trimmed, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Daily counter increments on every kid-sent message, not on AI responses
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
        agentName: currentAgent.name,
      };

      const withReply = [...newMessages, assistantMsg];

      // Break reminders: inject a non-AI coach message after every Nth kid message
      let finalMessages = withReply;
      const every = settings.breakReminderEvery || 0;
      if (every > 0 && newCount > 0 && newCount % every === 0) {
        const useEmojis = settings.useEmojis !== false;
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

      // Save to history if enabled (don't persist the local break-reminder bubble —
      // it's UI-only and would be confusing in an export)
      if (settings.chatStorage === 'local') {
        const existing = loadChats(kid.id);
        saveChats(kid.id, [...existing, userMsg, assistantMsg]);
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

  const renderContent = (text) => {
    if (!settings.blockLinks) return text;
    // Make any URLs non-clickable plaintext
    return text.replace(/https?:\/\/[^\s]+/g, '[link]').replace(/www\.[^\s]+/g, '[link]');
  };

  return (
    <div className={styles.page} data-font-size={settings.fontSize || 'normal'}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>←</button>
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
                onClick={() => { setCurrentAgent(a); setShowAgentPicker(false); }}>
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
                <div className={styles.bubbleText}>{renderContent(msg.content)}</div>
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
  );
}
