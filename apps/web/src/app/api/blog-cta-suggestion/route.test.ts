import { afterEach, describe, expect, it, vi } from "vitest";

const { getBlogBySlugDraft, getBlogCtas } = vi.hoisted(() => ({
  getBlogBySlugDraft: vi.fn(),
  getBlogCtas: vi.fn(),
}));
vi.mock("@/lib/blog", () => ({ getBlogBySlugDraft }));
vi.mock("@/lib/blog-cta/resolve", () => ({ getBlogCtas }));

import { GET } from "./route";

const call = (query: string, token?: string) =>
  GET(
    new Request(`https://web.test/api/blog-cta-suggestion${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }) as never,
  );

const ctas = {
  slug: "post",
  explore: { kind: "catalog", imageCount: 1, featured: [], href: "x", pullCommand: null },
  learn: { slug: "r", title: "A resource", typeLabel: "Report" },
  prove: { href: "/book-a-demo", label: "x" },
};

describe("GET /api/blog-cta-suggestion", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("is disabled until the shared secret is set", async () => {
    expect((await call("?slug=post", "s3cret")).status).toBe(503);
  });

  it("rejects a missing or wrong token", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    expect((await call("?slug=post")).status).toBe(401);
    expect((await call("?slug=post", "nope")).status).toBe(401);
    expect(getBlogBySlugDraft).not.toHaveBeenCalled();
  });

  it("rejects a slug that is not a slug", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    expect((await call("?slug=../etc/passwd", "s3cret")).status).toBe(400);
    expect((await call("", "s3cret")).status).toBe(400);
  });

  it("is 404 for a post that does not exist", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    getBlogBySlugDraft.mockResolvedValue(null);
    expect((await call("?slug=missing", "s3cret")).status).toBe(404);
  });

  it("returns the automatic pick with the editor's picks cleared", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    getBlogBySlugDraft.mockResolvedValue({ slug: "post", ctaResource: 7, ctaImage: "redis" });
    getBlogCtas.mockResolvedValue(ctas);

    const res = await call("?slug=post", "s3cret");

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true, resource: { title: "A resource", typeLabel: "Report", slug: "r" }, image: null });
    expect(getBlogCtas).toHaveBeenCalledWith(expect.objectContaining({ ctaResource: null, ctaImage: null }));
  });
});
