---
category: Chat
---

ChatPanel — The chat surface — 380x560 sunken panel with a bordered header, a scrolling message body, and a composer footer.

## Usage

```tsx
<ChatPanel
  docked
  title="FinishLine Assistant"
  onClose={() => setOpen(false)}
  footer={<><ChatInput placeholder="Ask about your ticket…" /><ChatSend>Send</ChatSend></>}
  meta="Answers are generated. An engineer reviews anything urgent."
>
  <ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
  <ChatMessage from="user">Our office printer dropped off the network.</ChatMessage>
  <ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>
</ChatPanel>
```

## Notes

Pinned to the bottom-right of the viewport by default. Pass `docked` to lay it out in normal flow — required inside cards, previews, and any bounded container.
