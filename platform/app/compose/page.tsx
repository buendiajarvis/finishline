import type { Metadata } from "next";
import { ComposeClient } from "./compose-client";

export const metadata: Metadata = {
  title: "Composer (internal)",
  robots: { index: false, follow: false },
};

export default function ComposePage() {
  return <ComposeClient />;
}
