import { afterEach, describe, expect, it, vi } from "vitest";

// The page imports the syntax highlighter, which is guarded by server-only.
vi.mock("server-only", () => ({}));

const { getGuideBySlug, getGuideBySlugDraft } = vi.hoisted(() => ({
  getGuideBySlug: vi.fn(),
  getGuideBySlugDraft: vi.fn(),
}));
vi.mock("@/lib/guides", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/guides")>()),
  getGuideBySlug,
  getGuideBySlugDraft,
}));

import { CmsFetchError } from "@/lib/cms-fetch";
import GuideDetailPage, { generateMetadata, renderGuideDetail } from "./page";

const props = (slug: string) => ({ params: Promise.resolve({ slug }) });
const cmsDown = () => new CmsFetchError(500, "/api/guides");

// A failed CMS read must surface as an error, never as notFound(): at build
// time Next retries the page and fails the build rather than publishing a 404,
// and during ISR it keeps serving the last good page.
describe("guide detail route", () => {
  afterEach(() => vi.clearAllMocks());

  it("rethrows a CMS failure instead of rendering a 404", async () => {
    getGuideBySlug.mockRejectedValue(cmsDown());
    await expect(GuideDetailPage(props("sbom"))).rejects.toBeInstanceOf(CmsFetchError);
  });

  it("rethrows a CMS failure on the draft path too", async () => {
    getGuideBySlugDraft.mockRejectedValue(cmsDown());
    await expect(renderGuideDetail({ slug: "sbom", draft: true })).rejects.toBeInstanceOf(
      CmsFetchError,
    );
  });

  it("rethrows a CMS failure from metadata instead of marking the page noindex", async () => {
    getGuideBySlug.mockRejectedValue(cmsDown());
    await expect(generateMetadata(props("sbom"))).rejects.toBeInstanceOf(CmsFetchError);
  });

  it("still renders a 404 when the CMS has no such guide", async () => {
    getGuideBySlug.mockResolvedValue(null);
    await expect(GuideDetailPage(props("no-such-guide"))).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
