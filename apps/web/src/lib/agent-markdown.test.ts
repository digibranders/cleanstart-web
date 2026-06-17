import { describe, expect, it } from "vitest";

import {
  acceptsMarkdown,
  estimateMarkdownTokens,
  htmlToMarkdown,
} from "./agent-markdown";

describe("acceptsMarkdown", () => {
  it("matches an explicit text/markdown request", () => {
    expect(acceptsMarkdown("text/markdown")).toBe(true);
    expect(acceptsMarkdown("text/html, text/markdown;q=0.9")).toBe(true);
    expect(acceptsMarkdown("TEXT/MARKDOWN")).toBe(true);
  });

  it("never triggers on browser Accept headers", () => {
    expect(
      acceptsMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      ),
    ).toBe(false);
    expect(acceptsMarkdown("*/*")).toBe(false);
    expect(acceptsMarkdown("text/*")).toBe(false);
    expect(acceptsMarkdown(null)).toBe(false);
    expect(acceptsMarkdown("")).toBe(false);
  });

  it("respects q=0 (explicitly not acceptable)", () => {
    expect(acceptsMarkdown("text/markdown;q=0")).toBe(false);
    expect(acceptsMarkdown("text/markdown;q=0.0, text/html")).toBe(false);
  });
});

describe("htmlToMarkdown", () => {
  const page = `<!doctype html><html><head><title>About CleanStart</title>
    <style>.x{color:red}</style><script>alert(1)</script></head>
    <body><nav><a href="/">Home</a></nav>
    <main><h1>Secure containers</h1><p>Zero-CVE base <strong>images</strong>.</p>
    <ul><li>FIPS</li><li>SBOM</li></ul>
    <script>track()</script></main>
    <footer>© CleanStart</footer></body></html>`;

  it("scopes to <main> and leads with the document title", () => {
    const md = htmlToMarkdown(page);
    expect(md.startsWith("# About CleanStart")).toBe(true);
    expect(md).toContain("# Secure containers");
    expect(md).toContain("Zero-CVE base **images**.");
    expect(md).toContain("* FIPS");
    expect(md).not.toContain("Home");
    expect(md).not.toContain("© CleanStart");
  });

  it("drops script and style content", () => {
    const md = htmlToMarkdown(page);
    expect(md).not.toContain("alert(1)");
    expect(md).not.toContain("track()");
    expect(md).not.toContain("color:red");
  });

  it("falls back to <body> when there is no <main>", () => {
    const md = htmlToMarkdown(
      "<html><head><title>T</title></head><body><p>hello</p></body></html>",
    );
    expect(md).toContain("hello");
  });

  it("handles bare fragments without title", () => {
    expect(htmlToMarkdown("<p>frag</p>")).toBe("frag\n");
  });

  it("decodes HTML entities in the document title", () => {
    const md = htmlToMarkdown(
      "<html><head><title>Verified &amp; Secure &#39;Images&#39;</title></head><body><main><p>x</p></main></body></html>",
    );
    expect(md.startsWith("# Verified & Secure 'Images'")).toBe(true);
  });
});

describe("estimateMarkdownTokens", () => {
  it("estimates ~4 chars per token, rounding up", () => {
    expect(estimateMarkdownTokens("abcd")).toBe(1);
    expect(estimateMarkdownTokens("abcde")).toBe(2);
    expect(estimateMarkdownTokens("")).toBe(0);
  });
});
