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

const nonceOf = (csp: string | null): string => /'nonce-([^']+)'/.exec(csp ?? "")?.[1] ?? "";

describe("content security policy", () => {
  it("gives each page request its own nonce, in the response policy and in the request header Next reads", () => {
    const a = proxy(request("/sign-in"));
    const b = proxy(request("/sign-in"));
    const csp = a.headers.get("Content-Security-Policy");
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(nonceOf(csp)).not.toBe("");
    expect(nonceOf(csp)).not.toBe(nonceOf(b.headers.get("Content-Security-Policy")));
    expect(a.headers.get("x-middleware-override-headers")).toContain("content-security-policy");
    expect(a.headers.get("x-middleware-request-x-nonce")).toBe(nonceOf(csp));
    expect(a.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
  });

  it("puts the policy on signed in pages too, and leaves API routes to the closed policy in next.config", () => {
    const signedIn = proxy(request("/partner/deals", { cookie: "better-auth.session_token=abc.def" }));
    expect(signedIn.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
    expect(proxy(request("/api/auth/get-session")).headers.get("Content-Security-Policy")).toBeNull();
  });

  it("does not hold the open paths back: the health check and the HubSpot webhook get no policy and no gate", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    for (const path of ["/api/health", "/api/hubspot/webhook"]) {
      const response = proxy(request(path));
      expect(response.status, path).toBe(200);
      expect(response.headers.get("Content-Security-Policy"), path).toBeNull();
    }
  });

  it("does not add the policy to the review gate answer or to a redirect", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/sign-in")).headers.get("Content-Security-Policy")).toBeNull();
    expect(proxy(request("/partner/deals", { authorization: basic("let-me-in") })).headers.get("Content-Security-Policy")).toBeNull();
  });
});

describe("client address header", () => {
  const forwarded = { "x-forwarded-for": "6.6.6.6, 203.0.113.9" };

  it("is never taken from the client, and is not set when no proxy is trusted", () => {
    const response = proxy(request("/sign-in", { ...forwarded, "x-portal-client-ip": "9.9.9.9" }));
    expect(response.headers.get("x-middleware-request-x-portal-client-ip")).toBeNull();
    // Next hands the app only the headers named here, so the client's own value is gone.
    expect(response.headers.get("x-middleware-override-headers")).not.toContain("x-portal-client-ip");
  });

  it("is the address the trusted proxy saw, never the first entry a client can write", () => {
    vi.stubEnv("PORTAL_TRUSTED_PROXY_HOPS", "1");
    const response = proxy(request("/api/auth/sign-in/email", { ...forwarded, "x-portal-client-ip": "9.9.9.9" }));
    expect(response.headers.get("x-middleware-request-x-portal-client-ip")).toBe("203.0.113.9");
  });

  it("is also overwritten on the open paths", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    vi.stubEnv("PORTAL_TRUSTED_PROXY_HOPS", "1");
    const response = proxy(request("/api/hubspot/webhook", { ...forwarded, "x-portal-client-ip": "9.9.9.9" }));
    expect(response.headers.get("x-middleware-request-x-portal-client-ip")).toBe("203.0.113.9");
  });
});

// Odd spellings of the open and the signed in paths. Next.js matches routes on the decoded path, so a spelling the
// proxy does not recognise must never lose a gate that the plain spelling has.
describe("odd path variants", () => {
  const gate = { PORTAL_REVIEW_PASSWORD: "let-me-in" };

  it.each([
    ["/api/health/", "trailing slash"],
    ["/API/health", "upper case"],
    ["/api/%68ealth", "percent encoded letter"],
    ["/api/hubspot/webhook/", "webhook with a trailing slash"],
    ["/api/hubspot/webhook/../x", "webhook with a dot segment"],
    ["/api/hubspot/%77ebhook", "webhook with a percent encoded letter"],
  ])("keeps the review gate on %s (%s): only the exact open paths skip it", (path) => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", gate.PORTAL_REVIEW_PASSWORD);
    expect(proxy(request(path)).status, path).toBe(401);
    expect(proxy(request(path, { authorization: basic("let-me-in") })).status, path).toBe(200);
  });

  it.each([
    ["/%61dmin/approvals", "percent encoded letter in admin"],
    ["/%70artner/overview", "percent encoded letter in partner"],
    ["/partner%2Fdeals", "encoded slash after partner"],
    ["/admin%2f..%2fadmin", "encoded dot segment"],
  ])("sends a signed out visit to %s (%s) to sign in", (path) => {
    const response = proxy(request(path));
    expect(response.status, path).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname, path).toBe("/sign-in");
  });

  it("treats a differently cased /Partner/overview as a public path: Next.js routes are case sensitive, so no page answers it", () => {
    expect(isProtectedPath("/Partner/overview")).toBe(false);
    expect(proxy(request("/Partner/overview")).status).toBe(200);
  });

  it("leaves a path with only a malformed percent escape public, and answers it rather than throwing", () => {
    expect(proxy(request("/%E0%A4%A")).status).toBe(200);
  });

  it("decodes per segment, so one malformed escape does not hide the protected area from the check", () => {
    expect(isProtectedPath("/%61dmin/x%zz")).toBe(true);
    const response = proxy(request("/%61dmin/x%zz"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/sign-in");
  });
});

describe("demo mode", () => {
  const paths = ["/sign-in", "/partner/deals", "/api/health", "/api/auth/get-session", "/api/hubspot/webhook"];

  it("marks every response noindex, whatever the proxy answered", () => {
    vi.stubEnv("PORTAL_DEMO_MODE", "1");
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "open-sesame");
    for (const path of paths) {
      expect(proxy(request(path)).headers.get("x-robots-tag"), `${path} without a password`).toBe("noindex, nofollow");
      expect(proxy(request(path, { authorization: basic("open-sesame"), cookie: "better-auth.session_token=a.b" })).headers.get("x-robots-tag"), path).toBe("noindex, nofollow");
    }
  });

  it("still asks for the review password and still leaves the health check open", () => {
    vi.stubEnv("PORTAL_DEMO_MODE", "1");
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "open-sesame");
    expect(proxy(request("/sign-in")).status).toBe(401);
    expect(proxy(request("/sign-in", { authorization: basic("wrong") })).status).toBe(401);
    expect(proxy(request("/sign-in", { authorization: basic("open-sesame") })).status).toBe(200);
    expect(proxy(request("/api/health")).status).toBe(200);
  });

  it("adds nothing when the switch is off: the real portal answers exactly as before", () => {
    vi.stubEnv("PORTAL_DEMO_MODE", "true");
    for (const path of paths) expect(proxy(request(path)).headers.get("x-robots-tag"), path).toBeNull();
  });
});
