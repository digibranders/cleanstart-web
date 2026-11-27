import type React from "react";

/** "Watch the Lesson" player for a direct MP4 URL. Shared by knowledge hub, guides and blogs. */
export function LessonVideo({
  src,
  className = "mt-10",
}: {
  src: string;
  className?: string;
}): React.ReactElement {
  return (
    <div className={className}>
      <p
        className="mb-3 font-medium uppercase tracking-[0.08em] text-cs-purple-1"
        style={{ fontSize: "var(--fs-eyebrow)" }}
      >
        Watch the Lesson
      </p>
      <div className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        {/* biome-ignore lint/a11y/useMediaCaption: Academy lesson videos ship without a caption track. */}
        <video controls preload="metadata" playsInline className="h-full w-full" src={src} />
      </div>
    </div>
  );
}
