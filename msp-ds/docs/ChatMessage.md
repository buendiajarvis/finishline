---
category: Chat
---

ChatMessage — One chat bubble. Alignment, background, and border all follow from `from`.

## Usage

```tsx
<ChatMessage from="bot">Hi — what can we help with?</ChatMessage>
<ChatMessage from="user">Our office printer dropped off the network.</ChatMessage>
<ChatMessage from="system">Engineer paged — 2 min ago</ChatMessage>
```

## Notes

`user` is the cyan-tinted bubble on the right, `bot` the bordered bubble on the left, `system` centred mono meta text with no bubble.
