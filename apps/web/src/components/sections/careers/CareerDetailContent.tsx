import { RenderLexical } from "@/lib/renderLexical";
import type { LexicalRoot } from "@/lib/blog";
import type { Job } from "@/lib/jobs";
import { JobDescriptionPdfLink } from "./JobDescriptionPdfLink";

interface CareerDetailContentProps {
  body?: LexicalRoot | null | undefined;
  descriptionPdf?: Job["descriptionPdf"];
  jobTitle: string;
}

export function CareerDetailContent({
  body,
  descriptionPdf,
  jobTitle,
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

        {/* After the role description, before the apply form: read the role,
            take the full JD away with you, then apply. */}
        <JobDescriptionPdfLink descriptionPdf={descriptionPdf} jobTitle={jobTitle} />
      </div>
    </section>
  );
}
