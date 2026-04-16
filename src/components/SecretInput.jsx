import { useState } from 'react';

// Password-style input with an eye toggle to reveal the value. Used for PIN
// creation and API keys — anywhere the parent legitimately needs to verify
// what they've typed. Not used for the PIN unlock screen (where hiding is
// the whole point).
export default function SecretInput({ value, onChange, placeholder, inputMode, maxLength, autoFocus, style }) {
  const [shown, setShown] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <input
        className="input"
        type={shown ? 'text' : 'password'}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        style={{ paddingRight: 44, width: '100%' }}
      />
      <button
        type="button"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? 'Hide' : 'Show'}
        title={shown ? 'Hide' : 'Show'}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
          fontSize: 18, lineHeight: 1, color: 'var(--text-muted)',
        }}
      >
        {shown ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
