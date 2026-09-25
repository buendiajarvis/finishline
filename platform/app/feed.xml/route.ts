import { listIssues, formatIssueDate } from "@/lib/signals";
import { SITE, SIGNALS_BRAND } from "@/lib/site";

export const dynamic = "force-static";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function GET() {
  const issues = listIssues();
  const items = issues
    .map((i) => {
      const link = `${SITE.url}/signals/${i.date}`;
      const desc = `${i.dek || i.headline} — ${formatIssueDate(i.date)}, ${i.stories.length} stories.`;
      const d = new Date(`${i.date}T13:00:00Z`);
      const pubDate = (Number.isNaN(d.getTime()) ? new Date() : d).toUTCString();
      return `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SIGNALS_BRAND)} — AI Signals</title>
    <link>${esc(`${SITE.url}/signals`)}</link>
    <description>${esc(SITE.description)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
