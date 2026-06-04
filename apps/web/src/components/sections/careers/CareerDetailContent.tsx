import { RenderLexical } from "@/lib/renderLexical";
import type { LexicalRoot } from "@/lib/blog";

interface CareerDetailContentProps {
  body?: LexicalRoot | null | undefined;
  contactEmail: string;
}

export function CareerDetailContent({
  body,
  contactEmail,
}: CareerDetailContentProps): React.ReactElement {
  return (
    <section className="relative w-full bg-white overflow-x-clip">
      <div className="relative mx-auto max-w-[820px] px-6 sm:px-10 pt-16 pb-24">
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
            Full role description coming soon — please reach out via the form
            below to apply.
          </p>
        )}

        <p
          className="font-sans"
          style={{
            fontSize: "var(--prose-body)",
            color: "rgba(17,17,17,0.7)",
            lineHeight: 1.6,
            marginTop: "32px",
            marginBottom: "20px",
          }}
        >
          Interested candidates should submit their resume to{" "}
          <a
            href={`mailto:${contactEmail}`}
            style={{ color: "#4a3bf1", textDecoration: "underline" }}
          >
            {contactEmail}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
