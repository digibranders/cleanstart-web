import { afterEach, describe, expect, it, vi } from "vitest";

const { getRenderedSignature } = vi.hoisted(() => ({
  getRenderedSignature: vi.fn(),
}));
vi.mock("@/lib/email-signatures", () => ({ getRenderedSignature }));

import { GET } from "./route";

const SIGNATURE_HTML =
  '<table><tr><td><p>Nilesh Jain</p><p>Co-founder &amp; CEO</p>' +
  '<a href="mailto:nilesh.jain@cleanstart.com">nilesh.jain@cleanstart.com</a>' +
  '<img src="https://cdn.cleanstart.com/emails/assets/logo.png" alt="CleanStart logo" />' +
  "</td></tr></table>";

const get = (slug: string) =>
  GET(new Request(`https://www.cleanstart.com/email-signatures/${slug}`), {
    params: Promise.resolve({ slug }),
  });

describe("GET /email-signatures/[slug]", () => {
  afterEach(() => vi.clearAllMocks());

  describe("when the signature exists", () => {
    const ok = () => {
      getRenderedSignature.mockResolvedValue({
        slug: "nilesh-jain",
        name: "Nilesh Jain",
        jobTitle: "Co-founder & CEO",
        html: SIGNATURE_HTML,
      });
      return get("nilesh-jain");
    };

    it("serves the signature markup as HTML", async () => {
      const res = await ok();
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
      await expect(res.text()).resolves.toContain(SIGNATURE_HTML);
    });

    it("puts nothing but the signature in the body, so ⌘A copies only it", async () => {
      const body = (await (await ok()).text()).match(
        /<body>([\s\S]*)<\/body>/,
      )?.[1];
      expect(body).toBe(SIGNATURE_HTML);
    });

    it("carries no site chrome", async () => {
      const html = await (await ok()).text();
      expect(html).not.toMatch(/<header|<nav|<footer|main-content/i);
    });

    it("escapes the document title so a name cannot break out of it", async () => {
      getRenderedSignature.mockResolvedValue({
        slug: "x",
        name: '</title><script>alert(1)</script>',
        jobTitle: "",
        html: "<p>x</p>",
      });
      const html = await (await get("x")).text();
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;/title&gt;");
    });

    it("marks the page noindex, nofollow in both header and meta", async () => {
      const res = await ok();
      expect(res.headers.get("X-Robots-Tag")).toBe(
        "noindex, nofollow, noarchive",
      );
      await expect(res.text()).resolves.toContain(
        '<meta name="robots" content="noindex, nofollow" />',
      );
    });

    it("neutralises admin-authored markup with a script-free CSP", async () => {
      const csp = (await ok()).headers.get("Content-Security-Policy") ?? "";
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("img-src https://cdn.cleanstart.com");
      expect(csp).toContain("frame-ancestors 'none'");
      // No script source is ever granted — email clients strip scripts anyway,
      // so nothing legitimate needs one.
      expect(csp).not.toContain("script-src");
      expect(csp).not.toContain("unsafe-eval");
    });
  });

  describe("when the signature is missing or deactivated", () => {
    it("returns 404 without leaking the slug", async () => {
      getRenderedSignature.mockResolvedValue(null);
      const res = await get("someone-who-left");

      expect(res.status).toBe(404);
      const html = await res.text();
      expect(html).toContain("not available");
      expect(html).not.toContain("someone-who-left");
    });

    it("keeps the noindex header on the 404", async () => {
      getRenderedSignature.mockResolvedValue(null);
      const res = await get("nope");
      expect(res.headers.get("X-Robots-Tag")).toBe(
        "noindex, nofollow, noarchive",
      );
    });
  });
});
