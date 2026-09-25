import { ChatPanel, ChatMessage, ChatInput, ChatSend, ChatTab } from "finishline-msp-ds";

/** The docked panel with a real conversation — the way to render it in a bounded space. */
export const Docked = () => (
  <ChatPanel
    docked
    title="FinishLine Assistant"
    footer={
      <>
        <ChatInput placeholder="Ask about your ticket…" />
        <ChatSend>Send</ChatSend>
      </>
    }
    meta="Answers are generated. An engineer reviews anything urgent."
  >
    <ChatMessage from="system">Session started — 09:41</ChatMessage>
    <ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
    <ChatMessage from="user">Our office printer dropped off the network this morning.</ChatMessage>
    <ChatMessage from="bot">
      The print server is reachable but the queue is stalled. I&apos;ve opened ticket FL-2291 and
      paged an engineer — expect a call within 15 minutes.
    </ChatMessage>
    <ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>
  </ChatPanel>
);

/** With the source tabs the widget uses to scope its answers. */
export const WithSourceTabs = () => (
  <ChatPanel
    docked
    title="Knowledge lookup"
    footer={
      <>
        <ChatInput placeholder="Search runbooks…" />
        <ChatSend>Ask</ChatSend>
      </>
    }
  >
    <div className="chatbot-source-tabs">
      <ChatTab active>Knowledge base</ChatTab>
      <ChatTab>Your tickets</ChatTab>
      <ChatTab>Contracts</ChatTab>
    </div>
    <ChatMessage from="bot">Searching the knowledge base. What are you looking for?</ChatMessage>
  </ChatPanel>
);

/** Opening state — one greeting, nothing else. */
export const Empty = () => (
  <ChatPanel
    docked
    title="FinishLine Assistant"
    footer={
      <>
        <ChatInput placeholder="Ask about your ticket…" />
        <ChatSend>Send</ChatSend>
      </>
    }
  >
    <ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
  </ChatPanel>
);
