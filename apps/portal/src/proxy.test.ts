import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isProtectedPath, proxy } from "./proxy";

const request = (path: string, headers: Record<string, string> = {}): NextRequest =>
  new NextRequest(`http://localhost:3204${path}`, { headers });

const basic = (password: string): string => `Basic ${btoa(`reviewer:${password}`)}`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isProtectedPath", () => {
  it.each(["/partner", "/partner/deals", "/partner/deals/abc", "/admin", "/admin/audit"])("protects %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/sign-in", "/apply", "/apply/done", "/accept-invite", "/reset-password", "/api/auth/get-session", "/partnership", "/administrator"])(
    "leaves %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe("session redirect", () => {
  it("sends a signed out visit to sign in with the page and its query", () => {
    const response = proxy(request("/partner/deals?status=pending"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("next")).toBe("/partner/deals?status=pending");
  });

  it("lets a request with a session cookie through, plain or secure", () => {
    for (const name of ["better-auth.session_token", "__Secure-better-auth.session_token"]) {
      const response = proxy(request("/admin/approvals", { cookie: `${name}=abc.def` }));
      expect(response.status, name).toBe(200);
      expect(response.headers.get("location"), name).toBeNull();
    }
  });

  it("leaves public pages alone without a cookie", () => {
    for (const path of ["/sign-in", "/apply", "/accept-invite?token=x", "/reset-password?token=x", "/api/auth/sign-in/email"]) {
      expect(proxy(request(path)).status, path).toBe(200);
    }
  });

  it("hands the path to Server Components and overwrites a path the client sent", () => {
    const response = proxy(
      request("/partner/overview?tab=1", { cookie: "better-auth.session_token=abc.def", "x-portal-path": "/admin/audit" }),
    );
    expect(response.headers.get("x-middleware-request-x-portal-path")).toBe("/partner/overview?tab=1");
  });

  it("overwrites a client supplied path on a public page too", () => {
    const response = proxy(request("/sign-in", { "x-portal-path": "//evil.example.com" }));
    expect(response.headers.get("x-middleware-request-x-portal-path")).toBe("/sign-in");
  });
});

describe("review gate", () => {
  it("is off without PORTAL_REVIEW_PASSWORD", () => {
    expect(proxy(request("/sign-in")).status).toBe(200);
  });

  it("answers 401 without the shared password and with a wrong one", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    const none = proxy(request("/sign-in"));
    expect(none.status).toBe(401);
    expect(none.headers.get("www-authenticate")).toContain("Basic");
    expect(proxy(request("/sign-in", { authorization: basic("nope") })).status).toBe(401);
  });

  it("answers 401, not an error, to an authorization header that is not valid base64", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/sign-in", { authorization: "Basic %%%not-base64%%%" })).status).toBe(401);
  });

  it("compares the password by digest: an equal length near miss and a longer string are refused", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/sign-in", { authorization: basic("let-me-iN") })).status).toBe(401);
    expect(proxy(request("/sign-in", { authorization: basic("let-me-in!") })).status).toBe(401);
    expect(proxy(request("/sign-in", { authorization: basic("") })).status).toBe(401);
    expect(proxy(request("/sign-in", { authorization: basic("let-me-in") })).status).toBe(200);
  });

  it("leaves /api/health open while the gate is on, for the container health check", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/api/health")).status).toBe(200);
  });

  it("leaves the HubSpot webhook open while the gate is on, because the route verifies its own signature", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/api/hubspot/webhook")).status).toBe(200);
    expect(proxy(request("/api/hubspot/webhook/other")).status).toBe(401);
  });

  it("opens with the right password and still applies the session redirect", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    const authorization = basic("let-me-in");
    expect(proxy(request("/sign-in", { authorization })).status).toBe(200);
    expect(proxy(request("/partner/deals", { authorization })).status).toBe(307);
  });
});
