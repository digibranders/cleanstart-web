import { RenderLexical } from "@/lib/renderLexical";
import type { LexicalRoot } from "@/lib/blog";

interface CareerDetailContentProps {
  body?: LexicalRoot | null | undefined;
}

export function CareerDetailContent({
  body,
}: CareerDetailContentProps): React.ReactElement {
  return (
    <section className="relative w-full bg-white overflow-x-clip">
      <div className="relative mx-auto max-w-[820px] px-6 sm:px-10 pt-16 pb-6">
        {body ? (
          <div className="article-body">
            <RenderLexical content={body} />
          </div>
        ) : (
          <p
            className="font-sans"
            style={{
              fontSize: "var(--prose-body)",
              color: "rgba(17,17,17,0.65)",
              lineHeight: 1.6,
            }}
          >
            Full role description coming soon. Please reach out via the form
            below to apply.
          </p>
        )}
      </div>
    </section>
  );
}
