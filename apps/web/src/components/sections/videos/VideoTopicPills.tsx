import Link from "next/link";
import type { Video } from "@/lib/videos-utils";

export function VideoTopicPills({
  topics,
  tone = "light",
}: {
  topics: Video["topics"];
  tone?: "light" | "dark";
}): React.ReactElement | null {
  if (topics.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Topics">
      {topics.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/videos?topic=${topic.slug}#library`}
            className={`inline-flex h-9 items-center rounded-full px-4 font-sans text-[14px] transition-colors duration-200 motion-reduce:transition-none ${tone === "dark" ? "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white" : "bg-[#F1EFF8] text-[#3D3A4F] hover:bg-[#E7E2FA] hover:text-[#3A1BA8]"}`}
          >
            {topic.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
