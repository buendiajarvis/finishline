---
category: Chat
---

ChatLauncher — Fixed bottom-right cyan pill that opens the chat panel, carrying the strong cyan glow.

## Usage

```tsx
<ChatLauncher onClick={() => setOpen(true)} hidden={open}>Ask FinishLine</ChatLauncher>
```

## Notes

Fixed to the viewport, so inside a bounded container it will escape. Pass `hidden` while the panel is open, as the live site does.
