# Preassessment Design Coherence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `preassessment/` (the Next.js AI-readiness questionnaire app) visually match finishlinemsp.com's dark navy/cyan design system, so it reads as the same product instead of an unstyled prototype.

**Architecture:** Copy the `:root` CSS custom-property token block, fonts, and reset rules from `index.html` into `preassessment/app/globals.css`. Add two new shared components (`Nav`, `Footer`) ported from the main site's markup, wired into `app/layout.js` so every route gets them automatically. Recolor the two existing page components (`app/page.js`, `app/booking-confirmed/page.js`) from Tailwind gray/teal defaults to the token-driven palette.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS (utility classes coexist with custom-property-driven inline styles/classes — no Tailwind config changes needed since colors are applied via CSS custom properties, not Tailwind color utilities).

## Global Constraints

- Styling only — no changes to `lib/questions.js`, any `app/api/*` route, or Stripe checkout logic.
- Source of truth for tokens is `index.html` lines 16-133 (`:root` block) and 138-159 (reset/base) — copy values exactly, do not reinterpret.
- Fonts: `Hanken Grotesk` (`--ff-display`) for headings, `JetBrains Mono` (`--ff-mono`) for labels/data/mono text, loaded via the same Google Fonts URL the main site uses.
- Primary CTA buttons use `--primary-container` background + `var(--glow-cyan)`/`var(--glow-cyan-strong)` box-shadow on hover, matching `.nav-cta` in `index.html:274-289`.
- No automated test suite exists for this app — verification is manual (`npm run dev` + click-through), per Task 6.

---

### Task 1: Port design tokens into `globals.css`

**Files:**
- Modify: `preassessment/app/globals.css` (currently 9 lines, Tailwind directives + bare reset)

**Interfaces:**
- Produces: CSS custom properties (`--background`, `--on-surface`, `--surface-container`, `--surface-container-low`, `--surface-container-high`, `--outline-variant`, `--primary-container`, `--on-primary`, `--ff-display`, `--ff-mono`, `--glow-cyan`, `--glow-cyan-strong`, plus the full set from `index.html:16-133`) available globally to every component in later tasks.

- [ ] **Step 1: Replace the file contents**

Replace `preassessment/app/globals.css` entirely with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Foundation */
  --surface: #0c1324;
  --surface-dim: #0c1324;
  --surface-bright: #33394c;
  --surface-container-lowest: #070d1f;
  --surface-container-low: #151b2d;
  --surface-container: #191f31;
  --surface-container-high: #23293c;
  --surface-container-highest: #2e3447;

  /* On-surface (text) */
  --on-surface: #dce1fb;
  --on-surface-variant: #b9cacb;

  /* Inverse */
  --inverse-surface: #dce1fb;
  --inverse-on-surface: #2a3043;

  /* Outlines */
  --outline: #849495;
  --outline-variant: #3b494b;

  /* Primary — Electric Cyan */
  --surface-tint: #00dbe9;
  --primary: #dbfcff;
  --on-primary: #00363a;
  --primary-container: #00f0ff;
  --on-primary-container: #006970;
  --inverse-primary: #006970;

  /* Secondary — Steel Blue */
  --secondary: #b7c8e1;
  --on-secondary: #213145;
  --secondary-container: #3a4a5f;
  --on-secondary-container: #a9bad3;

  /* Tertiary — Lavender */
  --tertiary: #f5f5ff;
  --on-tertiary: #283044;
  --tertiary-container: #d1d9f3;
  --on-tertiary-container: #575e75;

  /* Error */
  --error: #ffb4ab;
  --on-error: #690005;
  --error-container: #93000a;
  --on-error-container: #ffdad6;

  --background: #0c1324;
  --on-background: #dce1fb;
  --surface-variant: #2e3447;

  /* Typography */
  --ff-display: 'Hanken Grotesk', system-ui, sans-serif;
  --ff-mono: 'JetBrains Mono', ui-monospace, monospace;

  --fs-display-lg: 48px;
  --fs-display-lg-mobile: 32px;
  --fs-headline-md: 24px;
  --fs-body-md: 16px;
  --fs-mono-label: 12px;
  --fs-mono-data: 14px;

  --lh-body-md: 1.6;
  --ls-mono-label: 0.05em;

  /* Spacing — 4px base unit */
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --container-max: 1440px;
  --margin-desktop: 64px;
  --margin-mobile: 20px;

  /* Glow */
  --glow-cyan: 0 0 15px rgba(0, 219, 233, 0.08);
  --glow-cyan-strong: 0 0 30px rgba(0, 219, 233, 0.15);
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  padding: 0;
  margin: 0;
}

body {
  background: var(--background);
  color: var(--on-surface);
  font-family: var(--ff-display);
  font-size: var(--fs-body-md);
  font-weight: 400;
  line-height: var(--lh-body-md);
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--margin-desktop);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--margin-mobile);
  }
}
```

- [ ] **Step 2: Verify dev server picks up the change**

Run: `cd preassessment && npm run dev`
Then open `http://localhost:3000` in a browser.
Expected: page background is dark navy (not white), even though `page.js` still has its old Tailwind gray classes layered on top (those get replaced in Task 5) — you should at minimum see the `<body>` background and any un-classed text using the new dark theme and fonts.

- [ ] **Step 3: Commit**

```bash
git add preassessment/app/globals.css
git commit -m "style(preassessment): port finishlinemsp.com design tokens into globals.css"
```

---

### Task 2: Build the shared `Nav` component

**Files:**
- Create: `preassessment/components/Nav.js`

**Interfaces:**
- Consumes: CSS custom properties from Task 1 (`--outline-variant`, `--primary-container`, `--on-surface`, `--ff-mono`, `--fs-mono-data`, `--ls-mono-label`, `--space-3`, `--container-max`, `--margin-desktop`).
- Produces: default export `Nav` (React component, no props) — later consumed by `app/layout.js` in Task 4.

- [ ] **Step 1: Create the component**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add preassessment/components/Nav.js
git commit -m "feat(preassessment): add shared Nav component matching finishlinemsp.com"
```

---

### Task 3: Build the shared `Footer` component

**Files:**
- Create: `preassessment/components/Footer.js`

**Interfaces:**
- Consumes: CSS custom properties from Task 1 (`--outline-variant`, `--primary-container`, `--on-surface-variant`, `--ff-mono`, `--fs-mono-label`, `--ls-mono-label`, `--space-2`, `--space-8`, `--space-10`).
- Produces: default export `Footer` (React component, no props) — later consumed by `app/layout.js` in Task 4.

- [ ] **Step 1: Create the component**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add preassessment/components/Footer.js
git commit -m "feat(preassessment): add shared Footer component matching finishlinemsp.com"
```

---

### Task 4: Wire Nav and Footer into the root layout

**Files:**
- Modify: `preassessment/app/layout.js`

**Interfaces:**
- Consumes: `Nav` from `./components/Nav` (Task 2), `Footer` from `./components/Footer` (Task 3).

- [ ] **Step 1: Update the layout**

Replace `preassessment/app/layout.js` with:

```js
import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Free AI Readiness Assessment | Finish Line MSP',
  description: 'A quick, tailored assessment that shows exactly where AI and automation can help your organization.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div style={{ paddingTop: '56px' }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify in browser**

Run: `cd preassessment && npm run dev` (if not already running)
Open `http://localhost:3000`.
Expected: dark nav bar fixed at top with glowing cyan dot + "FINISHLINE" wordmark linking to finishlinemsp.com; footer with matching links and location string at the bottom of the page; page content no longer hidden under the fixed nav.

- [ ] **Step 3: Commit**

```bash
git add preassessment/app/layout.js
git commit -m "feat(preassessment): wire Nav and Footer into root layout"
```

---

### Task 5: Recolor `app/page.js` (questionnaire + offering screen)

**Files:**
- Modify: `preassessment/app/page.js`

**Interfaces:**
- Consumes: CSS custom properties from Task 1. No prop/signature changes — `Home`, `QuestionField`, `OfferingScreen`, `Centered` keep identical names, params, and behavior; only `className`/`style` values change.

- [ ] **Step 1: Replace `Centered`'s wrapper classes**

In `preassessment/app/page.js`, replace:

```js
function Centered({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-6">
      <div className="text-center">{children}</div>
    </div>
  );
}
```

with:

```js
function Centered({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-center" style={{ color: 'var(--on-surface)' }}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Recolor the `generating` and `paying` stage markup**

Replace:

```js
  if (stage === 'generating') {
    return (
      <Centered>
        <Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Analyzing your responses…</h2>
        <p className="text-slate-600 mt-2">Building your tailored assessment.</p>
      </Centered>
    );
  }

  if (stage === 'paying') {
    return (
      <Centered>
        <Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Redirecting to secure checkout…</h2>
      </Centered>
    );
  }
```

with:

```js
  if (stage === 'generating') {
    return (
      <Centered>
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--primary-container)' }} />
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--ff-display)' }}>Analyzing your responses…</h2>
        <p className="mt-2" style={{ color: 'var(--on-surface-variant)' }}>Building your tailored assessment.</p>
      </Centered>
    );
  }

  if (stage === 'paying') {
    return (
      <Centered>
        <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--primary-container)' }} />
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--ff-display)' }}>Redirecting to secure checkout…</h2>
      </Centered>
    );
  }
```

- [ ] **Step 3: Recolor the main questionnaire screen**

Replace:

```js
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Free AI Readiness Assessment</h1>
          <p className="text-slate-600 mt-1">A few tailored questions to map out where AI can help.</p>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">{section.title}</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="space-y-6">
          {questions.map((q) => (
            <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          ))}

          {dynamicQuestions.length > 0 && (
            <div className="pt-4 border-t border-dashed border-teal-300">
              <p className="text-xs font-medium text-teal-600 mb-4 uppercase tracking-wide">
                A couple of follow-ups based on what you shared
              </p>
              <div className="space-y-6">
                {dynamicQuestions.map((q) => (
                  <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={goNext}
          disabled={loadingFollowUps}
          className="mt-10 w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loadingFollowUps ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : sectionIndex < SECTIONS.length - 1 || dynamicQuestions.length > 0 ? (
            <>
              Continue <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            'Generate My Assessment'
          )}
        </button>
      </div>
    </div>
  );
}
```

with:

```js
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div style={{ borderBottom: '1px solid var(--outline-variant)' }}>
        <div className="max-w-xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
            Free AI Readiness Assessment
          </h1>
          <p className="mt-1" style={{ color: 'var(--on-surface-variant)' }}>
            A few tailored questions to map out where AI can help.
          </p>
        </div>
      </div>

      <div
        className="sticky z-10"
        style={{ top: '56px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)' }}
      >
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: 'var(--primary-container)', boxShadow: 'var(--glow-cyan)' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h2
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}
        >
          {section.title}
        </h2>

        {error && <p className="mb-4" style={{ color: 'var(--error)' }}>{error}</p>}

        <div className="space-y-6">
          {questions.map((q) => (
            <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          ))}

          {dynamicQuestions.length > 0 && (
            <div className="pt-4" style={{ borderTop: '1px dashed var(--outline)' }}>
              <p
                className="text-xs font-medium mb-4 uppercase tracking-wide"
                style={{ fontFamily: 'var(--ff-mono)', color: 'var(--surface-tint)' }}
              >
                A couple of follow-ups based on what you shared
              </p>
              <div className="space-y-6">
                {dynamicQuestions.map((q) => (
                  <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={goNext}
          disabled={loadingFollowUps}
          className="mt-10 w-full font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: 'var(--primary-container)',
            color: 'var(--on-primary)',
            boxShadow: 'var(--glow-cyan)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan-strong)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--glow-cyan)'; }}
        >
          {loadingFollowUps ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : sectionIndex < SECTIONS.length - 1 || dynamicQuestions.length > 0 ? (
            <>
              Continue <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            'Generate My Assessment'
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Recolor `QuestionField`**

Replace the whole `QuestionField` function with:

```js
function QuestionField({ question, value, onChange }) {
  const fieldStyle = {
    background: 'var(--surface-container-low)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface)',
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--on-surface)' }}>
        {question.label}
        {question.required && <span className="ml-1" style={{ color: 'var(--surface-tint)' }}>*</span>}
      </label>

      {question.type === 'text' || question.type === 'email' || question.type === 'tel' ? (
        <input
          type={question.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg focus:outline-none"
          style={fieldStyle}
        />
      ) : question.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none"
          style={fieldStyle}
        />
      ) : question.type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg focus:outline-none"
          style={fieldStyle}
        >
          <option value="">Select an option</option>
          {question.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : question.type === 'radio' ? (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center p-3 rounded-lg cursor-pointer"
              style={{ border: '1px solid var(--outline-variant)' }}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4"
              />
              <span className="ml-3" style={{ color: 'var(--on-surface-variant)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      ) : question.type === 'checkbox' ? (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const arr = value || [];
            return (
              <label
                key={opt}
                className="flex items-center p-3 rounded-lg cursor-pointer"
                style={{ border: '1px solid var(--outline-variant)' }}
              >
                <input
                  type="checkbox"
                  checked={arr.includes(opt)}
                  onChange={() =>
                    onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt])
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="ml-3" style={{ color: 'var(--on-surface-variant)' }}>{opt}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Recolor `OfferingScreen`**

Replace the whole `OfferingScreen` function with:

```js
function OfferingScreen({ offering, onSelectPackage }) {
  return (
    <div className="min-h-screen py-12 px-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-lg p-8 mb-8"
          style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-container)' }}
            >
              <Check className="w-5 h-5" style={{ color: 'var(--on-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
              Your Tailored Assessment
            </h1>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {offering.content}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
          Reserve Your Consultation
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.type}
              className="rounded-lg p-6"
              style={{
                background: 'var(--surface-container-low)',
                border: pkg.popular ? '2px solid var(--primary-container)' : '1px solid var(--outline-variant)',
                boxShadow: pkg.popular ? 'var(--glow-cyan)' : 'none',
              }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>{pkg.name}</h3>
              <p className="text-2xl font-bold mt-2" style={{ fontFamily: 'var(--ff-mono)', color: 'var(--on-surface)' }}>
                ${pkg.price}
              </p>
              <p className="text-sm mb-4" style={{ fontFamily: 'var(--ff-mono)', color: 'var(--on-surface-variant)' }}>
                {pkg.duration}
              </p>
              <button
                onClick={() => onSelectPackage(pkg.type)}
                className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                style={{ background: 'var(--primary-container)', color: 'var(--on-primary)' }}
              >
                <CreditCard className="w-4 h-4" /> Reserve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify in browser**

Run: `cd preassessment && npm run dev` (if not already running)
Open `http://localhost:3000`. Walk through: type answers in the first section, click Continue, confirm follow-up questions render dark-themed, complete all sections, confirm "Generate My Assessment" triggers the dark-themed loading state and then the offering screen with recolored package cards.
Expected: no `slate-*`/`teal-*`/`emerald-*` Tailwind color classes visibly rendering — background dark navy throughout, headings in Hanken Grotesk, price/duration in JetBrains Mono, Reserve buttons solid cyan.

- [ ] **Step 7: Commit**

```bash
git add preassessment/app/page.js
git commit -m "style(preassessment): recolor questionnaire and offering screens to match finishlinemsp.com"
```

---

### Task 6: Recolor `booking-confirmed` page and do final walkthrough

**Files:**
- Modify: `preassessment/app/booking-confirmed/page.js`

**Interfaces:**
- No signature changes — `BookingConfirmed` stays a no-prop default export.

- [ ] **Step 1: Replace the component**

```js
'use client';

export default function BookingConfirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div
        className="rounded-lg p-12 max-w-md text-center"
        style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--ff-display)', color: 'var(--on-surface)' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>
          Check your email for confirmation details. We'll follow up shortly to schedule your session.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Full end-to-end manual walkthrough**

Run: `cd preassessment && npm run dev` (if not already running), and in a second terminal `stripe listen --forward-to localhost:3000/api/webhook` (requires `.env.local` filled in per the app README).

Walk through: homepage → answer all questionnaire sections → generate assessment → select a package → complete Stripe test checkout (card `4242 4242 4242 4242`) → land on `/booking-confirmed`.

Expected at every screen: dark navy background, Hanken Grotesk headings, JetBrains Mono labels/data, cyan primary buttons with glow, fixed Nav bar with FinishLine wordmark linking to finishlinemsp.com, Footer with matching links/location at the bottom. No default-white/Tailwind-gray screens remaining. No new browser console errors.

- [ ] **Step 3: Commit**

```bash
git add preassessment/app/booking-confirmed/page.js
git commit -m "style(preassessment): recolor booking-confirmed page to match finishlinemsp.com"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers "Token import"; Tasks 2-4 cover "Shared Nav + Footer"; Tasks 5-6 cover "Recolor existing screens" (questionnaire, offering, booking-confirmed); Task 6 Step 2 covers the spec's "Testing" section. All spec sections have a task.
- **No placeholders:** every step has complete, pasteable code — no TBD/TODO.
- **Type/signature consistency:** `Nav`/`Footer` take no props anywhere they're defined or consumed; `QuestionField`, `OfferingScreen`, `Centered` keep their original prop names (`question`, `value`, `onChange`, `offering`, `onSelectPackage`, `children`) across all tasks.
