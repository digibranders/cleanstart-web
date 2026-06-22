import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const draftModeMock = vi.fn();
vi.mock("next/headers", () => ({
  draftMode: async () => draftModeMock(),
}));

const fetchMock = vi.fn();

const ok = (data: unknown): Response => ({ ok: true, status: 200, json: async () => data }) as Response;

const load = async (env: Record<string, string> = {}) => {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  return import("./cms-fetch");
};

beforeEach(() => {
  globalThis.fetch = fetchMock as never;
  draftModeMock.mockReturnValue({ isEnabled: false });
  process.env.CMS_API_KEY = "";
});

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

const firstCall = (): unknown[] => fetchMock.mock.calls[0] ?? [];
const calledUrl = (): string => String(firstCall()[0]);
const calledInit = (): RequestInit & { next?: { revalidate?: number } } =>
  firstCall()[1] as RequestInit & { next?: { revalidate?: number } };

describe("fetchCMS — published mode", () => {
  it("uses ISR revalidate, sends no auth header, returns the JSON", async () => {
    const { fetchCMS } = await load();
    fetchMock.mockResolvedValue(ok({ docs: [1] }));
    const out = await fetchCMS<{ docs: number[] }>("/api/blogs?limit=1");
    expect(out).toEqual({ docs: [1] });
    expect(calledInit().next).toEqual({ revalidate: 3600 });
    expect(calledInit().cache).toBeUndefined();
    expect((calledInit().headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("honours noStore and a custom revalidate window", async () => {
    const { fetchCMS } = await load();
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs", { noStore: true });
    expect(calledInit().cache).toBe("no-store");

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs", { revalidateSeconds: 300 });
    expect(calledInit().next).toEqual({ revalidate: 300 });
  });

  it("throws CmsFetchError carrying the status on a non-2xx response", async () => {
    const { fetchCMS, CmsFetchError } = await load();
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);
    await expect(fetchCMS("/api/blogs")).rejects.toBeInstanceOf(CmsFetchError);
    await expect(fetchCMS("/api/blogs")).rejects.toMatchObject({ status: 503 });
  });
});

describe("fetchCMS — draft mode", () => {
  it("strips the published filter, adds draft=true, forces no-store", async () => {
    draftModeMock.mockReturnValue({ isEnabled: true });
    const { fetchCMS } = await load();
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs?where[_status][equals]=published&limit=1");
    const url = calledUrl();
    expect(url).not.toContain("_status");
    expect(url).toContain("draft=true");
    expect(url).toContain("limit=1");
    expect(calledInit().cache).toBe("no-store");
  });

  it("sends the API-Key authorization header when configured", async () => {
    draftModeMock.mockReturnValue({ isEnabled: true });
    const { fetchCMS } = await load({ CMS_API_KEY: "secret-key", CMS_API_KEY_COLLECTION: "users" });
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs");
    expect((calledInit().headers as Record<string, string>).Authorization).toBe(
      "users API-Key secret-key",
    );
  });

  it("can be forced per-call via options.draft without the cookie", async () => {
    draftModeMock.mockReturnValue({ isEnabled: false });
    const { fetchCMS } = await load();
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs", { draft: true });
    expect(calledUrl()).toContain("draft=true");
    expect(draftModeMock).not.toHaveBeenCalled();
  });

  it("treats a draftMode() throw (no request context) as published", async () => {
    draftModeMock.mockImplementation(() => {
      throw new Error("outside request scope");
    });
    const { fetchCMS } = await load();
    fetchMock.mockResolvedValue(ok({}));
    await fetchCMS("/api/blogs");
    expect(calledUrl()).not.toContain("draft=true");
    expect(calledInit().next).toEqual({ revalidate: 3600 });
  });
});
