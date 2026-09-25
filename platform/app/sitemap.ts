import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listIssues } from "@/lib/signals";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const staticRoutes = ["", "/signals", "/contact", "/msp"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const issues = listIssues().map((i) => ({
    url: `${base}/signals/${i.date}`,
    lastModified: i.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...issues];
}
