import { ChatInput, ChatSend } from "finishline-msp-ds";

/** The composer row — input beside its send button. */
export const ComposerRow = () => (
  <div className="chatbot-foot" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
    <ChatInput placeholder="Ask about your ticket…" />
    <ChatSend>Send</ChatSend>
  </div>
);

/** Empty, filled, and disabled. */
export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <ChatInput placeholder="Ask about your ticket…" />
    <ChatInput defaultValue="Why is the print queue stalled?" />
    <ChatInput defaultValue="Waiting for a reply…" disabled />
  </div>
);
