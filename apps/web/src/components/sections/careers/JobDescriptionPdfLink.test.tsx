import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JobDescriptionPdfLink } from "./JobDescriptionPdfLink";

const render = (pdf: Parameters<typeof JobDescriptionPdfLink>[0]["descriptionPdf"]) =>
  renderToStaticMarkup(
    <JobDescriptionPdfLink descriptionPdf={pdf} jobTitle="Senior Software Engineer" />,
  );

// Tags are removed, not replaced with a space: substituting a space invents
// whitespace the rendered page does not have, which let a missing space
// between the label and "(PDF…)" pass a green test.
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const PDF = {
  url: "https://cdn.cleanstart.com/web/job/senior-software-engineer-aa7cd030.pdf",
  filename: "senior-software-engineer-aa7cd030.pdf",
  mimeType: "application/pdf",
  filesize: 352662,
};

describe("JobDescriptionPdfLink", () => {
  it("names the role in the link text, so the purpose survives out of context", () => {
    // WCAG 2.4.4: a screen reader lists links without surrounding content, so
    // "Download" alone would say nothing. This is the same defect that was just
    // fixed on the resource detail CTA.
    const html = render(PDF);

    expect(text(html)).toBe(
      "Download the Senior Software Engineer job description (PDF, 344 KB)",
    );
    expect(html).toContain(`href="${PDF.url}"`);
  });

  it("opens in a new tab safely", () => {
    const html = render(PDF);

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("switches to MB once the file is large enough to matter", () => {
    expect(text(render({ ...PDF, filesize: 2_400_000 }))).toContain("(PDF, 2.3 MB)");
  });

  it("still renders without a size rather than printing a bogus one", () => {
    const expected = "Download the Senior Software Engineer job description (PDF)";
    expect(text(render({ ...PDF, filesize: null }))).toBe(expected);
    expect(text(render({ ...PDF, filesize: 0 }))).toBe(expected);
    // `exactOptionalPropertyTypes` forbids passing an explicit undefined, so
    // the absent case omits the key the way an unpopulated payload would.
    const { filesize: _omitted, ...withoutSize } = PDF;
    expect(text(render(withoutSize))).toBe(expected);
  });

  it("renders nothing when the relationship is an unpopulated id", () => {
    // depth 0 returns the media id, not the document. The component guards so
    // callers never have to.
    expect(render(400)).toBe("");
  });

  it("renders nothing when there is no PDF or no URL on it", () => {
    expect(render(null)).toBe("");
    expect(render(undefined)).toBe("");
    expect(render({ ...PDF, url: null })).toBe("");
    expect(render({ ...PDF, url: "   " })).toBe("");
  });
});
