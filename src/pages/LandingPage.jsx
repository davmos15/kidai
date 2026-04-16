import styles from './LandingPage.module.css';

export default function LandingPage({ config, onParent, onKid }) {
  const hasKids = config?.kids?.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🌟</span>
          <h1 className={styles.logoText}>KidAI</h1>
          <span className={styles.tagline}>Safe AI companions for curious kids</span>
        </div>

        <div className={styles.cards}>
          <button className={`${styles.card} ${styles.cardKid}`} onClick={onKid} disabled={!hasKids}>
            <div className={styles.cardEmoji}>🧒</div>
            <div className={styles.cardTitle}>I'm a Kid!</div>
            <div className={styles.cardDesc}>
              {hasKids ? 'Chat with your AI buddy' : 'Ask a parent to set up first'}
            </div>
            {hasKids && <div className={styles.cardArrow}>→</div>}
          </button>

          <button className={`${styles.card} ${styles.cardParent}`} onClick={onParent}>
            <div className={styles.cardEmoji}>👨‍👩‍👧</div>
            <div className={styles.cardTitle}>Parent / Setup</div>
            <div className={styles.cardDesc}>
              {config ? 'Manage agents, kids & settings' : 'Set up KidAI for your family'}
            </div>
            <div className={styles.cardArrow}>→</div>
          </button>
        </div>

        <p className={styles.footer}>
          🔒 All data stays on your device — nothing is sent to our servers
        </p>
      </div>
    </div>
  );
}
