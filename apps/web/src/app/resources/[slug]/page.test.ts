import { afterEach, describe, expect, it, vi } from "vitest";

// The page imports the syntax highlighter, which is guarded by server-only.
vi.mock("server-only", () => ({}));

const { getResourceBySlug, getResourceBySlugDraft } = vi.hoisted(() => ({
  getResourceBySlug: vi.fn(),
  getResourceBySlugDraft: vi.fn(),
}));
vi.mock("@/lib/resources", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/resources")>()),
  getResourceBySlug,
  getResourceBySlugDraft,
}));

import { CmsFetchError } from "@/lib/cms-fetch";
import ResourceDetailPage, { generateMetadata, renderResourceDetail } from "./page";

const props = (slug: string) => ({ params: Promise.resolve({ slug }) });
const cmsDown = () => new CmsFetchError(500, "/api/resources");

// Same contract as the guide route: a failed CMS read is an error, not a 404.
describe("resource detail route", () => {
  afterEach(() => vi.clearAllMocks());

  it("rethrows a CMS failure instead of rendering a 404", async () => {
    getResourceBySlug.mockRejectedValue(cmsDown());
    await expect(ResourceDetailPage(props("fips-compliance"))).rejects.toBeInstanceOf(
      CmsFetchError,
    );
  });

  it("rethrows a CMS failure on the draft path too", async () => {
    getResourceBySlugDraft.mockRejectedValue(cmsDown());
    await expect(
      renderResourceDetail({ slug: "fips-compliance", draft: true }),
    ).rejects.toBeInstanceOf(CmsFetchError);
  });

  it("rethrows a CMS failure from metadata instead of marking the page noindex", async () => {
    getResourceBySlug.mockRejectedValue(cmsDown());
    await expect(generateMetadata(props("fips-compliance"))).rejects.toBeInstanceOf(
      CmsFetchError,
    );
  });

  it("still renders a 404 when the CMS has no such resource", async () => {
    getResourceBySlug.mockResolvedValue(null);
    await expect(ResourceDetailPage(props("no-such-resource"))).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
