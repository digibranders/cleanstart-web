import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitLead } from "./submitLead";

const fetchMock = vi.fn();

const jsonResponse = (data: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => data }) as Response;

beforeEach(() => {
  globalThis.fetch = fetchMock as never;
});

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

const input = { formSlug: "book-a-demo", fields: { email: "a@b.com" } };

describe("submitLead", () => {
  it("POSTs to /api/leads/submit with the honeypot defaulted to empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await submitLead(input);
    const call = fetchMock.mock.calls[0] ?? [];
    const url = String(call[0]);
    const init = call[1] as RequestInit;
    expect(url).toMatch(/\/api\/leads\/submit$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ formSlug: "book-a-demo", website: "" });
  });

  it("returns { ok: true } on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    expect(await submitLead(input)).toEqual({ ok: true });
  });

  it("passes through the duplicate flag", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, duplicate: true }));
    expect(await submitLead(input)).toEqual({ ok: true, duplicate: true });
  });

  it("surfaces the server error when ok is false", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: "turnstile_failed" }, false, 403));
    expect(await submitLead(input)).toEqual({ ok: false, error: "turnstile_failed" });
  });

  it("defaults to submit_failed when the error body is unparseable", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);
    expect(await submitLead(input)).toEqual({ ok: false, error: "submit_failed" });
  });

  it("returns network_error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await submitLead(input)).toEqual({ ok: false, error: "network_error" });
  });

  describe("gated resource downloads", () => {
    const gated = {
      formSlug: "content-gated",
      fields: { email: "a@b.com", consent: true },
      context: { resourceId: 11 },
    };

    it("sends the resource id as submission context", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      await submitLead(gated);
      const init = (fetchMock.mock.calls[0] ?? [])[1] as RequestInit;
      expect(JSON.parse(init.body as string)).toMatchObject({ context: { resourceId: 11 } });
    });

    it("omits context entirely when there is no resource", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      await submitLead(input);
      const init = (fetchMock.mock.calls[0] ?? [])[1] as RequestInit;
      expect(JSON.parse(init.body as string)).not.toHaveProperty("context");
    });

    // The server validates a required consent field as `fields.consent === true`,
    // so the boolean has to survive serialisation rather than be stringified.
    it("sends a boolean consent field as a boolean", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      await submitLead(gated);
      const init = (fetchMock.mock.calls[0] ?? [])[1] as RequestInit;
      expect(JSON.parse(init.body as string).fields.consent).toBe(true);
    });

    // The API returns a path on the CMS. Resolved against the page it would hit
    // www.cleanstart.com, where no such route exists.
    it("returns the download with a relative url made absolute to the CMS", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          ok: true,
          download: { url: "/api/resources/r/download?token=t", expiresAt: 123 },
        }),
      );
      const result = await submitLead(gated);
      expect(result.ok).toBe(true);
      expect(result.download?.expiresAt).toBe(123);
      expect(result.download?.url).toMatch(/^https?:\/\/[^/]+\/api\/resources\/r\/download\?token=t$/);
    });

    it("keeps an already absolute download url unchanged", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          ok: true,
          download: { url: "https://cms.example.com/api/resources/r/download?token=t", expiresAt: 1 },
        }),
      );
      const result = await submitLead(gated);
      expect(result.download?.url).toBe("https://cms.example.com/api/resources/r/download?token=t");
    });

    it("returns no download key when the API sent none", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      expect(await submitLead(gated)).toEqual({ ok: true });
    });
  });
});
