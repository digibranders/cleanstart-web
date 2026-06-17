import type React from "react";

import type { AuthorDetail } from "@/lib/authors";
import { RenderLexical } from "@/lib/renderLexical";

interface AuthorBioProps {
  author: AuthorDetail;
}

export function AuthorBio({ author }: AuthorBioProps): React.ReactElement {
  const hasLong = !!author.bioLong?.root?.children?.length;
  const hasShort = !!author.bioShort;

  return (
    <section className="relative w-full bg-white">
      <div className="relative mx-auto max-w-[720px] px-6 pt-section-md pb-section-md">
        <div className="article-body">
          {hasLong ? (
            <RenderLexical content={author.bioLong} />
          ) : hasShort ? (
            <p className="article-paragraph">{author.bioShort}</p>
          ) : (
            <p className="article-paragraph">{fallbackBio(author)}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function fallbackBio(author: AuthorDetail): string {
  const { name, role } = author;
  if (!role) return `${name} is a contributor at CleanStart.`;
  return /cleanstart/i.test(role)
    ? `${name} is ${role}.`
    : `${name} is ${role} at CleanStart.`;
}
