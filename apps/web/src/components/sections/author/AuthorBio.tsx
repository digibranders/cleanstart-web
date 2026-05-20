import type React from "react";

import type { AuthorDetail } from "@/lib/authors";
import { RenderLexical } from "@/lib/renderLexical";

interface AuthorBioProps {
  author: AuthorDetail;
}

export function AuthorBio({ author }: AuthorBioProps): React.ReactElement | null {
  const hasLong = !!author.bioLong?.root?.children?.length;
  const hasTopics = !!author.topicAreas?.length;
  if (!hasLong && !hasTopics) return null;

  return (
    <section className="relative w-full bg-white">
      <div className="relative mx-auto max-w-[1120px] px-6 pt-section-md pb-section-sm">
        {hasTopics && (
          <div className="flex flex-col gap-3 pb-10">
            <h2
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(1.125rem, 1.5vw, 1.25rem)",
                color: "#111111",
              }}
            >
              Topic areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {author.topicAreas?.map((t, i) => (
                <span
                  key={`${t.topic}-${i}`}
                  className="inline-flex items-center px-3 py-1 text-sm"
                  style={{
                    background: "#F5F5F5",
                    color: "rgba(17,17,17,0.78)",
                    borderRadius: "999px",
                  }}
                >
                  {t.topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasLong && (
          <div className="flex flex-col gap-4">
            <h2
              className="font-display font-semibold"
              style={{
                fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
                letterSpacing: "-0.02em",
                color: "#111111",
              }}
            >
              About {author.name.split(" ")[0]}
            </h2>
            <RenderLexical content={author.bioLong} />
          </div>
        )}
      </div>
    </section>
  );
}
