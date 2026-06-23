import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitDealRegistration } from "./submitDealRegistration";

const fetchMock = vi.fn();
const jsonResponse = (data: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => data }) as Response;

const input = {
  partnerName: "Acme",
  partnerRep: { firstName: "Jane", lastName: "Doe", email: "jane@acme.com" },
  prospect: { firstName: "Sam", lastName: "Lee", email: "sam@prospect.com" },
  dealDetails: "K8s",
};

beforeEach(() => { globalThis.fetch = fetchMock as never; });
afterEach(() => { vi.restoreAllMocks(); fetchMock.mockReset(); });

describe("submitDealRegistration", () => {
  it("POSTs to /api/deal-registrations/apply with honeypot defaulted to empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const res = await submitDealRegistration(input);
    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/deal-registrations\/apply$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ partnerName: "Acme", hp: "" });
  });

  it("returns ok:false on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: "validation_failed" }, false, 400));
    const res = await submitDealRegistration(input);
    expect(res.ok).toBe(false);
  });

  it("returns ok:false network_error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    const res = await submitDealRegistration(input);
    expect(res).toEqual({ ok: false, error: "network_error" });
  });
});
