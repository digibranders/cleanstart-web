import type { Job } from "@/lib/jobs";

interface JobDescriptionPdfLinkProps {
  descriptionPdf: Job["descriptionPdf"];
  jobTitle: string;
}

/** "352662" reads as nothing; "344 KB" tells someone on mobile data what they are about to fetch. */
function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Download link for a role's JD PDF.
 *
 * The link text names the role rather than saying "Download", so its purpose
 * survives being read out of context in a screen reader's link list
 * (WCAG 2.4.4). Format and size are in the visible text for the same reason a
 * download should never be a surprise.
 *
 * Renders nothing when the relationship is unpopulated (a bare id at depth 0)
 * or has no URL, so a caller never has to guard.
 */
export function JobDescriptionPdfLink({
  descriptionPdf,
  jobTitle,
}: JobDescriptionPdfLinkProps): React.ReactElement | null {
  if (!descriptionPdf || typeof descriptionPdf !== "object") return null;
  const url = descriptionPdf.url?.trim();
  if (!url) return null;

  const size =
    typeof descriptionPdf.filesize === "number" && descriptionPdf.filesize > 0
      ? formatFileSize(descriptionPdf.filesize)
      : null;

  return (
    <p className="mt-8">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-sans underline underline-offset-[3px]"
        style={{ fontSize: "var(--prose-body)", color: "#4a3bf1" }}
      >
        Download the {jobTitle} job description{" "}
        <span style={{ color: "rgba(17,17,17,0.55)" }}>
          (PDF{size ? `, ${size}` : ""})
        </span>
      </a>
    </p>
  );
}
