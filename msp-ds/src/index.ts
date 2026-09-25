/**
 * FinishLine MSP — "Mission Control" design system.
 *
 * The components, tokens, and typography shipping on finishlinemsp.com:
 * a dark navy surface, one electric-cyan accent, Hanken Grotesk for prose,
 * and JetBrains Mono for every label, metric, and status readout.
 */

export { cx } from "./util";

export { AppShell } from "./shell";
export type { AppShellProps } from "./shell";

export {
  Container,
  Section,
  Grid12,
  SectionLabel,
  MonoData,
  PanelDivider,
  PulseDot,
  Indicator,
} from "./layout";
export type { SectionProps, IndicatorProps } from "./layout";

export { SiteNav, SiteFooter } from "./nav";
export type { SiteNavProps, SiteFooterProps, NavLink } from "./nav";

export { Hero } from "./hero";
export type { HeroProps } from "./hero";

export {
  CapabilityCard,
  CapabilityGrid,
  MetricBars,
  IntelCard,
  IntelFeed,
} from "./cards";
export type {
  CapabilityCardProps,
  CapabilityGridProps,
  MetricBarsProps,
  IntelCardProps,
  IntelFeedProps,
} from "./cards";

export { ApproachTimeline } from "./timeline";
export type { ApproachTimelineProps, ApproachPhase } from "./timeline";

export { CtaButton, CtaSection, StatusPanel } from "./cta";
export type { CtaButtonProps, CtaSectionProps, StatusPanelProps, StatusRow } from "./cta";

export {
  Form,
  FormRow,
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  FormNote,
  FormHoneypot,
  FormThanks,
} from "./form";
export type { FormFieldProps, FormThanksProps } from "./form";

export { ContactLayout, ContactPanel, ContactPoints, ContactPoint } from "./contact";
export type { ContactLayoutProps, ContactPanelProps } from "./contact";

export { ChatLauncher, ChatPanel, ChatMessage, ChatTab, ChatInput, ChatSend } from "./chat";
export type { ChatLauncherProps, ChatPanelProps, ChatMessageProps, ChatTabProps } from "./chat";
