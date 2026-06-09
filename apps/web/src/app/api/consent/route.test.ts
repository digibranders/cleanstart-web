import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://www.cleanstart.com/api/consent", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const validBody = {
  anonymousId: "id-1",
  decision: "accept_all",
  categories: {
    strictlyNecessary: true,
    performance: true,
    functional: true,
    targeting: true,
  },
  consentVersion: 2,
  gpc: false,
};

describe("POST /api/consent", () => {
  beforeEach(() => {
    process.env.CONSENT_LOG_HMAC_SECRET = "hmac-secret";
    process.env.CONSENT_INGEST_SECRET = "ingest-secret";
    process.env.NEXT_PUBLIC_CMS_URL = "http://cms.test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects an invalid body with 400", async () => {
    const res = await POST(makeRequest({ decision: "bad" }) as never);
    expect(res.status).toBe(400);
  });

  it("accepts a valid body and forwards hashed fields to the CMS", async () => {
    const res = await POST(
      makeRequest(validBody, {
        "x-vercel-ip-country": "DE",
        "x-forwarded-for": "203.0.113.7",
        "user-agent": "jest",
      }) as never,
    );
    expect(res.status).toBe(204);
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    if (!call) throw new Error("expected fetch to be called");
    expect(call[0]).toBe("http://cms.test/api/consentLog/ingest");
    const forwarded = JSON.parse((call[1] as RequestInit).body as string);
    expect(forwarded.country).toBe("DE");
    expect(forwarded.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(forwarded.userAgentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(forwarded).not.toHaveProperty("ip");
  });

  it("still returns 204 when the CMS forward fails (fire-and-forget)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("down"),
    );
    const res = await POST(makeRequest(validBody) as never);
    expect(res.status).toBe(204);
  });
});
