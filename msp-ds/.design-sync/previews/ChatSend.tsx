import { ChatSend, ChatInput } from "finishline-msp-ds";

/** Enabled and disabled. */
export const States = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <ChatSend>Send</ChatSend>
    <ChatSend disabled>Send</ChatSend>
  </div>
);

/** In the composer row it belongs to. */
export const InComposer = () => (
  <div className="chatbot-foot" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
    <ChatInput defaultValue="Why is the print queue stalled?" />
    <ChatSend>Send</ChatSend>
  </div>
);
