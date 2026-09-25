import { type Story, spanClass } from "@/lib/signals";

export function StoryCard({ story }: { story: Story }) {
  const isPrimary = story.size === "primary";
  return (
    <article className={`fl-card flex flex-col p-6 ${spanClass(story.size)}`}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-[7px] w-[7px]"
          style={{ background: "var(--primary-container)", boxShadow: "0 0 6px rgba(0,240,255,0.6)" }}
          aria-hidden
        />
        <span className="eyebrow">{story.tag}</span>
      </div>
      {story.source && <div className="mono mt-3 text-[11px] text-[var(--on-surface-variant)]">{story.source}</div>}
      <h3
        className="mt-2 font-semibold leading-snug text-[var(--on-surface)]"
        style={{ fontSize: isPrimary ? "24px" : "18px" }}
      >
        {story.title}
      </h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--on-surface-variant)]">{story.excerpt}</p>
      {story.url && story.url !== "#" && (
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mono mt-3 inline-block text-[12px] text-[var(--primary-container)] hover:underline"
        >
          Read full story →
        </a>
      )}
      {story.why && (
        <div className="story-why">
          <b>Why this matters to your bottom line</b>
          {story.why}
        </div>
      )}
    </article>
  );
}
