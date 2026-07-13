export default function Footer() {
  return (
    <footer
      style={{
        padding: 'var(--space-10) 0',
        borderTop: '1px solid var(--outline-variant)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--ff-mono)',
            fontSize: 'var(--fs-mono-label)',
            fontWeight: 500,
            letterSpacing: 'var(--ls-mono-label)',
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ width: '6px', height: '6px', background: 'var(--primary-container)' }} />
          FinishLine
        </div>
        <ul
          style={{
            display: 'flex',
            gap: 'var(--space-8)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {[
            ['Careers', 'https://finishlinemsp.com#'],
            ['Research', 'https://finishlinemsp.com#'],
            ['Legal', 'https://finishlinemsp.com#'],
            ['Contact', 'https://finishlinemsp.com/msp/contact'],
          ].map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                style={{
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 'var(--fs-mono-label)',
                  fontWeight: 500,
                  letterSpacing: 'var(--ls-mono-label)',
                  color: 'var(--on-surface-variant)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <span
          style={{
            fontFamily: 'var(--ff-mono)',
            fontSize: 'var(--fs-mono-label)',
            fontWeight: 500,
            letterSpacing: 'var(--ls-mono-label)',
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase',
          }}
        >
          San Francisco &nbsp;·&nbsp; New York &nbsp;·&nbsp; London &nbsp;·&nbsp; Taipei &nbsp;·&nbsp; Manila
        </span>
      </div>
    </footer>
  );
}
