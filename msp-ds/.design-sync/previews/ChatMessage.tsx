import { ChatMessage } from "finishline-msp-ds";

/** All three senders — the component's only axis. */
export const Senders = () => (
  <div className="chatbot-body" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
    <ChatMessage from="system">Session started — 09:41</ChatMessage>
    <ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
    <ChatMessage from="user">Our office printer dropped off the network this morning.</ChatMessage>
    <ChatMessage from="bot">
      Got it. I can see the print server is reachable but the queue is stalled. I&apos;ve opened
      ticket FL-2291 and paged an engineer.
    </ChatMessage>
    <ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>
  </div>
);

/** A longer exchange, showing how bubbles wrap and alternate. */
export const Conversation = () => (
  <div className="chatbot-body" style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}>
    <ChatMessage from="user">Is the Sunday patch window still happening?</ChatMessage>
    <ChatMessage from="bot">
      Yes — 02:00 to 04:00 PDT. Workstations reboot automatically; the POS terminals are excluded
      so the store opens normally on Monday.
    </ChatMessage>
    <ChatMessage from="user">Can you skip the back office machines?</ChatMessage>
    <ChatMessage from="bot">Done. Those four are deferred to the following window.</ChatMessage>
  </div>
);
