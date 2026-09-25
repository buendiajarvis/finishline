// Generates docs/<Name>.md for every exported component.
// Frontmatter `category` drives the group each card lands in; the body becomes
// the component's .prompt.md — what the claude.ai/design agent reads before
// composing with it. Re-run after adding a component: node .design-sync/gen-docs.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs");
mkdirSync(outDir, { recursive: true });

/** @type {Record<string, {cat: string, sum: string, ex: string, notes?: string}>} */
const DOCS = {
  // ---------------------------------------------------------------- Foundations
  AppShell: {
    cat: "Foundations",
    sum: "Root wrapper that establishes the design system's ground — dark navy surface, base text colour, Hanken Grotesk, and `color-scheme: dark`.",
    ex: `<AppShell fullHeight>
  <SiteNav brand="FinishLine" cta={{ label: "Submit a ticket", href: "#ticket" }} />
  <Hero title="Your IT, handled." subtitle="Monitoring, security, helpdesk, and cloud." />
  <SiteFooter brand="FinishLine" location="Serving the Bay Area" />
</AppShell>`,
    notes: "**Wrap every screen in this.** The system has no light mode: without it, the light `--on-surface` text lands on the browser's white default and is effectively invisible. Skip it only when the host page already paints `--background` itself.",
  },
  Container: {
    cat: "Foundations",
    sum: "Page-width wrapper — caps content at 1440px and applies the responsive side margins (64px desktop, 24px tablet, 20px mobile).",
    ex: `<Container>
  <SectionLabel>Section 01 // What we run for you</SectionLabel>
  <h2>One team for everything with a power cord.</h2>
</Container>`,
    notes: "Every full-width band on the site puts its content inside one of these. Section components that already render a `Container` (Hero, CtaSection, ContactLayout, SiteFooter) do not need another.",
  },
  Section: {
    cat: "Foundations",
    sum: "Vertical rhythm band — 96px of padding above and below, with an optional sunken background.",
    ex: `<Section sunken>
  <Container>
    <SectionLabel>Approach</SectionLabel>
    <h2>How an engagement runs.</h2>
  </Container>
</Section>`,
    notes: "Alternate `sunken` sections to separate one band from the next without drawing a border. Sunken paints `--surface-container-lowest`, one step darker than the page.",
  },
  Grid12: {
    cat: "Foundations",
    sum: "The 12-column grid every layout on the site is built on, with the system's 24px gutter.",
    ex: `<Grid12>
  <div style={{ gridColumn: "span 8" }}>Main</div>
  <div style={{ gridColumn: "span 4" }}>Aside</div>
</Grid12>`,
    notes: "Children set their own span via `gridColumn`. Components that already span (CapabilityCard, IntelCard) manage it themselves.",
  },
  SectionLabel: {
    cat: "Foundations",
    sum: "Small uppercase cyan mono label that opens a section — the brand's most recognizable piece of micro-typography.",
    ex: `<SectionLabel>Managed IT // Always On</SectionLabel>`,
    notes: "Copy convention on the live site: short, uppercase, and often split with a `//` separator. Ships 16px of bottom margin.",
  },
  MonoData: {
    cat: "Foundations",
    sum: "Monospace data type — 14px JetBrains Mono for readouts, counts, timestamps, and anything that should read as telemetry rather than prose.",
    ex: `<MonoData>UPTIME 99.98% // 14 SITES MONITORED</MonoData>`,
  },
  PanelDivider: {
    cat: "Foundations",
    sum: "One-pixel hairline in the outline-variant colour, for separating stacked rows inside a panel.",
    ex: `<ContactPanel header="Submit a ticket">
  <FormField label="Name"><FormInput /></FormField>
  <PanelDivider />
  <FormNote>A real engineer responds in under 15 minutes.</FormNote>
</ContactPanel>`,
  },
  PulseDot: {
    cat: "Foundations",
    sum: "The 6px cyan square that pulses on a 2s loop — the site's \"system is live\" signal.",
    ex: `<div className="hero-eyebrow">
  <PulseDot />
  Managed IT // Always On
</div>`,
    notes: "Honours `prefers-reduced-motion` by holding still. Hero and IntelFeed can render one for you via their `pulse` prop — reach for this directly only when composing a custom row.",
  },
  Indicator: {
    cat: "Foundations",
    sum: "Static 6px status square — `live` glows cyan, `standby` is inert grey.",
    ex: `<div className="cta-panel-row">
  <Indicator state="live" />
  Helpdesk — accepting tickets
</div>`,
    notes: "The vocabulary StatusPanel and ContactPoint use. Unlike PulseDot it does not animate.",
  },

  // ---------------------------------------------------------------- Navigation
  SiteNav: {
    cat: "Navigation",
    sum: "Glassmorphism site header — 56px tall, translucent navy with a 12px backdrop blur, a glowing logo square, uppercase mono links, and one solid cyan CTA.",
    ex: `<SiteNav
  brand="FinishLine"
  links={[
    { label: "Services", href: "#services" },
    { label: "Approach", href: "#approach" },
  ]}
  cta={{ label: "Submit a ticket", href: "#ticket" }}
/>`,
    notes: "Fixed to the viewport top by default. Pass `inFlow` to lay it out in normal flow — required inside cards, previews, or any bounded container. Links hide below 640px, as on the live site. Pages using the fixed nav need top padding to clear it (Hero and ContactLayout already include it).",
  },
  SiteFooter: {
    cat: "Navigation",
    sum: "Page footer — top hairline, brand mark left, mono links centre, location readout right. Stacks and centres below 640px.",
    ex: `<SiteFooter
  brand="FinishLine"
  links={[
    { label: "Services", href: "/msp" },
    { label: "Contact", href: "/contact" },
  ]}
  location="Serving the Bay Area"
/>`,
  },

  // ---------------------------------------------------------------- Page sections
  Hero: {
    cat: "Page sections",
    sum: "Top-of-page hero — eyebrow, oversized display headline, supporting paragraph, and an action row on the left seven columns.",
    ex: `<Hero
  eyebrow="Managed IT // Always On"
  pulse
  title={<>Your IT, handled — <span className="glow">before it breaks.</span></>}
  subtitle="FinishLine is the managed IT partner for businesses that can't afford downtime. Monitoring, security, helpdesk, and cloud — one flat monthly fee, one team that owns the outcome."
  actions={
    <>
      <CtaButton href="#ticket">Submit a ticket</CtaButton>
      <CtaButton href="mailto:support@example.com" variant="quiet">Or email support →</CtaButton>
    </>
  }
/>`,
    notes: "Wrap accented words of `title` in a `<span>` to paint them cyan; add `className=\"glow\"` for the cyan text-shadow. Pass `videoSrc` to run a darkened background video behind the copy — it is absolutely positioned, so it stays inside the hero.",
  },
  CapabilityGrid: {
    cat: "Page sections",
    sum: "Header row plus a 12-column grid for a set of CapabilityCards.",
    ex: `<Container>
  <CapabilityGrid
    headline="One team for everything with a power cord."
    body="Monitoring, security, helpdesk, and cloud — scoped in weeks, not quarters."
  >
    <CapabilityCard num="01" title="Helpdesk & support" desc="Real engineers, not a phone tree." span={3} />
    <CapabilityCard num="02" title="Network & infrastructure" desc="Monitored 24/7 and fixed before you notice." span={3} />
    <CapabilityCard num="03" title="Security & backup" desc="Endpoint protection, patching, and tested backups." span={3} />
    <CapabilityCard num="04" title="Cloud & Microsoft 365" desc="Email, identity, and SaaS managed end to end." span={3} />
  </CapabilityGrid>
</Container>`,
  },
  ApproachTimeline: {
    cat: "Page sections",
    sum: "Horizontal process timeline — a hairline rule with a square cyan marker per phase, each carrying a mono index, title, and description.",
    ex: `<Container>
  <ApproachTimeline
    eyebrow={<SectionLabel>Section 02 // How it runs</SectionLabel>}
    title="Onboarding takes two weeks, not two quarters."
    phases={[
      { num: "Phase 01", title: "Audit", desc: "We inventory every device, licence, and vendor you are paying for." },
      { num: "Phase 02", title: "Stabilise", desc: "Patch, back up, and lock down whatever is on fire first.", active: true },
      { num: "Phase 03", title: "Monitor", desc: "Agents deployed, alerting wired to a human who answers." },
      { num: "Phase 04", title: "Improve", desc: "Quarterly roadmap so next year's IT costs less than this year's." },
    ]}
  />
</Container>`,
    notes: "Renders on the sunken background of its own. Four phases across is the site's shape; they drop to two-up at 1024px and stack at 640px. Mark the current phase `active` to light its marker.",
  },
  IntelFeed: {
    cat: "Page sections",
    sum: "Header plus a 12-column grid for IntelCards, with a live-status readout on the right.",
    ex: `<Container>
  <IntelFeed
    subtitle={<SectionLabel>Telemetry</SectionLabel>}
    title="What we are watching right now."
    status="LIVE // UPDATED 4 MIN AGO"
  >
    <IntelCard tag="Response" metric="11" metricUnit="min" label="Median first touch" desc="Across all tickets opened this month." />
    <IntelCard tag="Coverage" metric="24/7" label="Monitoring window" desc="Alerting routed to an on-call engineer, not a queue." />
    <IntelCard tag="Uptime" metric="99.98" metricUnit="%" label="Managed endpoints" desc="Rolling 90-day average across every managed site." />
  </IntelFeed>
</Container>`,
  },
  CtaSection: {
    cat: "Page sections",
    sum: "Closing call-to-action band on the sunken background — copy and buttons on the left seven columns, an optional panel on the right four.",
    ex: `<CtaSection
  title="Something broken right now?"
  desc="Submit a ticket and a real engineer contacts you within 15 minutes. No phone tree, no ticket purgatory."
  actions={<CtaButton href="#ticket">Submit a ticket</CtaButton>}
  aside={
    <StatusPanel
      header="System status"
      rows={[
        { label: "Helpdesk — accepting tickets", state: "live" },
        { label: "Onsite dispatch — standby", state: "standby" },
      ]}
    />
  }
/>`,
  },
  ContactLayout: {
    cat: "Page sections",
    sum: "The contact page's two-column shell — copy and promises on the left five columns, the form panel on the right six.",
    ex: `<ContactLayout
  title="Something broken? Tell us what's wrong."
  subtitle="Fill this out and a FinishLine engineer contacts you within 15 minutes."
  intro={
    <ContactPoints>
      <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
      <ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>
      <ContactPoint>You get a direct line back to the person handling it</ContactPoint>
    </ContactPoints>
  }
  direct={<>Or email <a href="mailto:support@example.com">support@example.com</a></>}
  panel={<ContactPanel header="Submit a ticket">{/* Form goes here */}</ContactPanel>}
/>`,
    notes: "Renders a `<main>` and includes the top padding that clears the fixed SiteNav. Both columns go full width at 1024px.",
  },

  // ---------------------------------------------------------------- Cards
  CapabilityCard: {
    cat: "Cards",
    sum: "Service tile — sunken panel, hairline border, a 2px cyan pip in the top-left corner, and a border that brightens on hover.",
    ex: `<CapabilityCard
  num="01"
  title="Helpdesk & support"
  desc="Real engineers, not a phone tree. Submit a ticket and get a human on it in minutes."
  span={3}
/>`,
    notes: "Defaults to `span={4}` (three per row). The four MSP service cards use `span={3}`. Cards reflow to two-up at 1024px and one-up at 640px on their own.",
  },
  IntelCard: {
    cat: "Cards",
    sum: "Telemetry tile — tag, oversized cyan metric, mono caption, and description on a sunken panel with a cyan corner pip.",
    ex: `<IntelCard
  tag="Response"
  metric="11"
  metricUnit="min"
  label="Median first touch"
  desc="Across every ticket opened this month."
/>

<IntelCard
  large
  tag="Ticket volume"
  metric="146"
  label="Last 30 days"
  desc="Resolved without an onsite visit."
  viz={<MetricBars active={[5, 7, 8]} />}
/>`,
    notes: "The `large` variant spans six columns and lays copy beside a visualization; pass that visualization as `viz`. The default variant spans four.",
  },
  MetricBars: {
    cat: "Cards",
    sum: "Compact 120x80 bar visualization — bottom-aligned, dim cyan with selected bars lit.",
    ex: `<MetricBars values={[40, 55, 30, 70, 45, 85, 60, 95, 75, 50]} active={[5, 7, 8]} />`,
    notes: "Built for the `viz` slot of a large IntelCard. Ten bars is the site's default shape; `values` are percentage heights and `active` are the indices rendered at full cyan.",
  },

  // ---------------------------------------------------------------- Actions
  CtaButton: {
    cat: "Actions",
    sum: "The site's link button — uppercase mono, square corners, cyan glow on hover. Renders an anchor, since every call to action here navigates.",
    ex: `<CtaButton href="#ticket">Submit a ticket</CtaButton>
<CtaButton href="/msp" variant="ghost">See what we cover</CtaButton>
<CtaButton href="mailto:support@example.com" variant="quiet">Or email support →</CtaButton>`,
    notes: "`solid` is the cyan block, `ghost` the cyan outline, `quiet` the bare inline link the hero uses for its secondary action. For a real form submission use FormSubmit, which is a `<button>`.",
  },
  StatusPanel: {
    cat: "Actions",
    sum: "Sunken side panel listing status rows, each with a square live/standby indicator.",
    ex: `<StatusPanel
  header="System status"
  rows={[
    { label: "Helpdesk — accepting tickets", state: "live" },
    { label: "Monitoring — all sites green", state: "live" },
    { label: "Onsite dispatch — standby", state: "standby" },
  ]}
/>`,
    notes: "Designed for the `aside` slot of a CtaSection, where it spans the right four columns.",
  },

  // ---------------------------------------------------------------- Forms
  Form: {
    cat: "Forms",
    sum: "Vertical form stack with the system's 20px rhythm. Wrap every field, row, and submit button in one of these.",
    ex: `<Form onSubmit={handleSubmit}>
  <FormRow>
    <FormField label="Name" htmlFor="name"><FormInput id="name" name="name" placeholder="Jane Okonkwo" /></FormField>
    <FormField label="Company" htmlFor="co"><FormInput id="co" name="company" placeholder="Northwind Dental" /></FormField>
  </FormRow>
  <FormField label="What's wrong?" htmlFor="detail" full>
    <FormTextarea id="detail" name="detail" placeholder="Server room is beeping and nobody can print." />
  </FormField>
  <FormHoneypot />
  <FormSubmit>Submit ticket</FormSubmit>
  <FormNote>A real engineer responds in under 15 minutes.</FormNote>
</Form>`,
    notes: "Also sets the 120px textarea minimum. Renders a real `<form>` — pass `onSubmit`, `action`, and `method` as usual.",
  },
  FormRow: {
    cat: "Forms",
    sum: "Two-up field row that collapses to a single column below 640px.",
    ex: `<FormRow>
  <FormField label="Name" htmlFor="name"><FormInput id="name" /></FormField>
  <FormField label="Email" htmlFor="email"><FormInput id="email" type="email" /></FormField>
</FormRow>`,
    notes: "Give a child FormField the `full` prop to make it span both columns.",
  },
  FormField: {
    cat: "Forms",
    sum: "Label-over-control pairing — the only way fields are assembled on this site.",
    ex: `<FormField label="Urgency" htmlFor="urgency" full>
  <FormSelect id="urgency" name="urgency" defaultValue="normal">
    <option value="down">Everything is down</option>
    <option value="normal">Normal — needs fixing today</option>
    <option value="quote">Just a quote</option>
  </FormSelect>
</FormField>`,
    notes: "Pass `htmlFor` matching the control's `id` so the label is wired up. `full` spans both columns of a FormRow.",
  },
  FormLabel: {
    cat: "Forms",
    sum: "Uppercase mono field label.",
    ex: `<FormLabel htmlFor="email">Work email</FormLabel>
<FormInput id="email" type="email" />`,
    notes: "FormField renders one for you — reach for this directly only when assembling a field by hand.",
  },
  FormInput: {
    cat: "Forms",
    sum: "Text input on the darkest surface with a hairline border that turns cyan on focus. Full width by default.",
    ex: `<FormInput id="email" name="email" type="email" placeholder="you@company.com" required />`,
    notes: "Forwards its ref. Accepts every native input attribute.",
  },
  FormSelect: {
    cat: "Forms",
    sum: "Select styled to match the text input, with the system's own grey caret drawn in the right margin.",
    ex: `<FormSelect id="type" name="type" defaultValue="support">
  <option value="new">New service</option>
  <option value="support">Technical support</option>
  <option value="quote">Request a quote</option>
</FormSelect>`,
    notes: "Native chrome is suppressed via `appearance: none`; the caret is an inline SVG background.",
  },
  FormTextarea: {
    cat: "Forms",
    sum: "Multi-line input, vertically resizable, 100px minimum — 120px inside a Form.",
    ex: `<FormTextarea id="detail" name="detail" rows={5} placeholder="Tell us what's broken and when it started." />`,
  },
  FormSubmit: {
    cat: "Forms",
    sum: "Solid cyan submit button — uppercase mono, left-aligned in the stack, glows on hover, dims to half opacity when disabled.",
    ex: `<FormSubmit disabled={sending}>{sending ? "Sending…" : "Submit ticket"}</FormSubmit>`,
    notes: "Defaults to `type=\"submit\"`. Use CtaButton instead when the action navigates rather than submits.",
  },
  FormNote: {
    cat: "Forms",
    sum: "Fine print under a form — 11px mono in the muted outline colour.",
    ex: `<FormNote>We reply within one business day. No marketing, ever.</FormNote>`,
  },
  FormHoneypot: {
    cat: "Forms",
    sum: "Off-screen honeypot field. Real users never see it; bots fill it, and the submit handler drops any payload where it is non-empty.",
    ex: `<Form onSubmit={handleSubmit}>
  {/* …real fields… */}
  <FormHoneypot />
  <FormSubmit>Submit ticket</FormSubmit>
</Form>`,
    notes: "Renders nothing visible — a preview card for it is intentionally near-empty. Read the field named by `name` (default `company_website`) in your submit handler and discard the submission if it has a value.",
  },
  FormThanks: {
    cat: "Forms",
    sum: "Post-submit confirmation state — centred glyph, heading, and copy.",
    ex: `<FormThanks
  title="Ticket received"
  desc="An engineer has been paged and will contact you within 15 minutes."
  visible={submitted}
/>`,
    notes: "Renders its own panel chrome unless it sits inside a ContactPanel, where it drops the border and background. Hidden unless `visible`.",
  },

  // ---------------------------------------------------------------- Contact
  ContactPanel: {
    cat: "Contact",
    sum: "Bordered panel on the sunken surface that holds the ticket form. Spans the right six columns of a ContactLayout.",
    ex: `<ContactPanel header="Submit a ticket">
  <Form onSubmit={handleSubmit}>
    <FormField label="Name" htmlFor="name"><FormInput id="name" /></FormField>
    <FormSubmit>Submit ticket</FormSubmit>
  </Form>
</ContactPanel>`,
  },
  ContactPoints: {
    cat: "Contact",
    sum: "Bulleted promise list — mono text with a glowing cyan square per row.",
    ex: `<ContactPoints>
  <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
  <ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>
  <ContactPoint>You get a direct line back to the person handling it</ContactPoint>
</ContactPoints>`,
  },
  ContactPoint: {
    cat: "Contact",
    sum: "One row of a ContactPoints list — a cyan indicator square and mono copy, top-aligned so multi-line rows stay tidy.",
    ex: `<ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>`,
    notes: "Always compose inside a ContactPoints wrapper — that is what supplies the row spacing.",
  },

  // ---------------------------------------------------------------- Chat
  ChatLauncher: {
    cat: "Chat",
    sum: "Fixed bottom-right cyan pill that opens the chat panel, carrying the strong cyan glow.",
    ex: `<ChatLauncher onClick={() => setOpen(true)} hidden={open}>Ask FinishLine</ChatLauncher>`,
    notes: "Fixed to the viewport, so inside a bounded container it will escape. Pass `hidden` while the panel is open, as the live site does.",
  },
  ChatPanel: {
    cat: "Chat",
    sum: "The chat surface — 380x560 sunken panel with a bordered header, a scrolling message body, and a composer footer.",
    ex: `<ChatPanel
  docked
  title="FinishLine Assistant"
  onClose={() => setOpen(false)}
  footer={<><ChatInput placeholder="Ask about your ticket…" /><ChatSend>Send</ChatSend></>}
  meta="Answers are generated. An engineer reviews anything urgent."
>
  <ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
  <ChatMessage from="user">Our office printer dropped off the network.</ChatMessage>
  <ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>
</ChatPanel>`,
    notes: "Pinned to the bottom-right of the viewport by default. Pass `docked` to lay it out in normal flow — required inside cards, previews, and any bounded container.",
  },
  ChatMessage: {
    cat: "Chat",
    sum: "One chat bubble. Alignment, background, and border all follow from `from`.",
    ex: `<ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
<ChatMessage from="user">Our office printer dropped off the network.</ChatMessage>
<ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>`,
    notes: "`user` is the cyan-tinted bubble on the right, `bot` the bordered bubble on the left, `system` centred mono meta text with no bubble.",
  },
  ChatTab: {
    cat: "Chat",
    sum: "Source-selector chip inside the chat panel — small mono chip that turns cyan when active.",
    ex: `<div className="chatbot-source-tabs">
  <ChatTab active>Knowledge base</ChatTab>
  <ChatTab>Your tickets</ChatTab>
  <ChatTab>Contracts</ChatTab>
</div>`,
    notes: "Wrap a set in a `.chatbot-source-tabs` div for the wrapping row layout.",
  },
  ChatInput: {
    cat: "Chat",
    sum: "Composer text input for the chat panel — smaller than FormInput, on the darkest surface, cyan border on focus.",
    ex: `<ChatInput placeholder="Ask about your ticket…" />`,
    notes: "Belongs in a ChatPanel's `footer` alongside a ChatSend.",
  },
  ChatSend: {
    cat: "Chat",
    sum: "Send button for the chat composer — compact solid cyan, mono, uppercase.",
    ex: `<ChatSend disabled={!draft}>Send</ChatSend>`,
  },
};

let n = 0;
for (const [name, d] of Object.entries(DOCS)) {
  const body = [
    "---",
    `category: ${d.cat}`,
    "---",
    "",
    `${name} — ${d.sum}`,
    "",
    "## Usage",
    "",
    "```tsx",
    d.ex,
    "```",
  ];
  if (d.notes) body.push("", "## Notes", "", d.notes);
  body.push("");
  writeFileSync(resolve(outDir, `${name}.md`), body.join("\n"));
  n++;
}
console.log(`wrote ${n} docs to ${outDir}`);
