import Link from "next/link";
import { SITE_URL } from "@/lib/seo/canonical";
import { linkify, parseDescription } from "@/lib/videos-utils";

function Linked({ text }: { text: string }): React.ReactElement {
  return (
    <>
      {linkify(text).map((segment, i) => {
        if (segment.kind === "text") return <span key={i}>{segment.text}</span>;
        const cls = "break-words font-medium text-[#5B2EE0] underline underline-offset-4 hover:text-[#3A1BA8]";
        // Links back to this site stay in-app; everything else opens in a new tab.
        if (segment.href.startsWith(SITE_URL)) {
          const path = segment.href.slice(SITE_URL.length) || "/";
          return (
            <Link key={i} href={path} className={cls}>
              {segment.text}
            </Link>
          );
        }
        return (
          <a key={i} href={segment.href} target="_blank" rel="noopener noreferrer" className={cls}>
            {segment.text}
          </a>
        );
      })}
    </>
  );
}

/** YouTube description rendered as paragraphs and lists, with URLs made clickable. */
export function VideoDescription({
  description,
}: {
  description: string;
}): React.ReactElement {
  const blocks = parseDescription(description);
  return (
    <div className="flex max-w-[680px] flex-col gap-5 font-sans text-[#2E2B3D]" style={{ fontSize: "var(--fs-body)", lineHeight: 1.7 }}>
      {blocks.map((block, i) =>
        block.kind === "list" ? (
          <ul key={i} className="flex list-disc flex-col gap-2 pl-5 marker:text-[#8C7BD9]">
            {block.lines.map((line, j) => (
              <li key={j}>
                <Linked text={line} />
              </li>
            ))}
          </ul>
        ) : (
          <div key={i} className="flex flex-col gap-2">
            {block.lines.map((line, j) => (
              <p key={j}>
                <Linked text={line} />
              </p>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
