import type { Metadata } from "next";
import { CrmClient } from "./crm-client";

export const metadata: Metadata = {
  title: "CRM (internal)",
  robots: { index: false, follow: false },
};

export default function CrmPage() {
  return <CrmClient />;
}
