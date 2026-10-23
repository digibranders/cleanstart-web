import Link from "next/link";
import { topicLabel, type Video } from "@/lib/videos-utils";

export function VideoTopicPills({
  topics,
}: {
  topics: Video["topics"];
}): React.ReactElement | null {
  if (topics.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Topics">
      {topics.map((id) => (
        <li key={id}>
          <Link
            href={`/videos?topic=${id}#library`}
            className="inline-flex h-9 items-center rounded-full bg-[#F1EFF8] px-4 font-sans text-[14px] text-[#3D3A4F] transition-colors duration-200 hover:bg-[#E7E2FA] hover:text-[#3A1BA8] motion-reduce:transition-none"
          >
            {topicLabel(id)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
