import { ChatTab } from "finishline-msp-ds";

/** A tab row with one selected — how the panel presents its sources. */
export const TabRow = () => (
  <div className="chatbot-source-tabs">
    <ChatTab active>Knowledge base</ChatTab>
    <ChatTab>Your tickets</ChatTab>
    <ChatTab>Contracts</ChatTab>
    <ChatTab>Runbooks</ChatTab>
  </div>
);

/** Active against inactive, isolated. */
export const States = () => (
  <div className="chatbot-source-tabs">
    <ChatTab active>Active</ChatTab>
    <ChatTab>Inactive</ChatTab>
  </div>
);
