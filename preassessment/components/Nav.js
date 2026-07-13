export default function Nav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(12, 19, 36, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--outline-variant)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}
      >
        <a
          href="https://finishlinemsp.com"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              background: 'var(--primary-container)',
              boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--ff-mono)',
              fontSize: 'var(--fs-mono-data)',
              fontWeight: 500,
              color: 'var(--on-surface)',
              letterSpacing: 'var(--ls-mono-label)',
              textTransform: 'uppercase',
            }}
          >
            FinishLine
          </span>
        </a>
      </div>
    </nav>
  );
}
