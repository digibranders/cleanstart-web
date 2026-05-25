import type React from "react";

import type { AuthorDetail } from "@/lib/authors";
import { RenderLexical } from "@/lib/renderLexical";

interface AuthorBioProps {
  author: AuthorDetail;
}

export function AuthorBio({ author }: AuthorBioProps): React.ReactElement | null {
  const hasLong = !!author.bioLong?.root?.children?.length;
  const hasShort = !!author.bioShort;
  if (!hasLong && !hasShort) return null;

  return (
    <section className="relative w-full bg-white">
      <div className="relative mx-auto max-w-[720px] px-6 pt-section-md pb-section-cta">
        <div className="article-body">
          {hasLong ? (
            <RenderLexical content={author.bioLong} />
          ) : (
            <p className="article-paragraph">{author.bioShort}</p>
          )}
        </div>
      </div>
    </section>
  );
}
