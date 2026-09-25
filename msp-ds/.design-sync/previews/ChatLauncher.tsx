import type { ReactNode } from "react";
import { ChatLauncher } from "finishline-msp-ds";

/**
 * The launcher is `position: fixed`, so it is rendered here inside a bounded,
 * relatively-positioned box — otherwise it escapes the card and pins itself to
 * the corner of the viewport.
 */
const Frame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      position: "relative",
      height: 160,
      background: "var(--surface-container-lowest)",
      border: "1px solid var(--outline-variant)",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

/** The launcher as it sits on the page, bottom-right. */
export const OnThePage = () => (
  <Frame>
    <ChatLauncher style={{ position: "absolute" }}>Ask FinishLine</ChatLauncher>
  </Frame>
);

/** Different labels. */
export const Labels = () => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
    <ChatLauncher style={{ position: "static" }}>Ask FinishLine</ChatLauncher>
    <ChatLauncher style={{ position: "static" }}>Chat with an engineer</ChatLauncher>
    <ChatLauncher style={{ position: "static" }}>Help</ChatLauncher>
  </div>
);
