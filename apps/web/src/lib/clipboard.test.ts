// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { sanitizeSignatureHtml } from "./clipboard";

const SIGNATURE =
  '<table><tr><td><img src="https://cdn.cleanstart.com/emails/assets/logo.png" alt="CleanStart logo" style="display: block" width="140" />' +
  '<p style="font-size: 12px">Start Clean. Stay Secure.</p></td>' +
  '<td><a href="mailto:a@cleanstart.com">a@cleanstart.com</a>' +
  '<a href="tel:+6596847785">+65-96847785</a></td></tr></table>';

describe("sanitizeSignatureHtml", () => {
  it("preserves the signature markup untouched", () => {
    const out = sanitizeSignatureHtml(SIGNATURE);
    expect(out).toContain("https://cdn.cleanstart.com/emails/assets/logo.png");
    expect(out).toContain("mailto:a@cleanstart.com");
    expect(out).toContain("tel:+6596847785");
    expect(out).toContain("Start Clean. Stay Secure.");
  });

  it("keeps inline style attributes — they are the entire layout", () => {
    // Wrapped in a table on purpose: the sanitiser reparses through HTML
    // parsing rules, which discard a `<td>` that is not inside a `<table>`.
    // Real input is always the complete table from the render endpoint.
    expect(
      sanitizeSignatureHtml('<table><tr><td style="padding: 0 15px">x</td></tr></table>'),
    ).toContain('style="padding: 0 15px"');
  });

  it("round-trips a complete signature without dropping structure", () => {
    const out = sanitizeSignatureHtml(SIGNATURE);
    expect((out.match(/<table/g) ?? []).length).toBe(1);
    expect((out.match(/<td/g) ?? []).length).toBe(2);
    expect((out.match(/<a /g) ?? []).length).toBe(2);
    expect((out.match(/<img/g) ?? []).length).toBe(1);
  });

  it("strips an onerror handler, the payload the copy path would execute", () => {
    const out = sanitizeSignatureHtml('<img src="x" onerror="alert(1)" />');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("alert(1)");
  });

  it("strips every on* handler regardless of casing", () => {
    const out = sanitizeSignatureHtml('<div OnMouseOver="alert(1)" onclick="x()">t</div>');
    expect(out.toLowerCase()).not.toContain("onmouseover");
    expect(out.toLowerCase()).not.toContain("onclick");
  });

  it("removes script and iframe elements", () => {
    const out = sanitizeSignatureHtml(
      '<p>ok</p><script>alert(1)</script><iframe src="https://evil"></iframe>',
    );
    expect(out).toContain("<p>ok</p>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<iframe");
  });

  it("removes a meta refresh, which no CSP directive can block", () => {
    const out = sanitizeSignatureHtml(
      '<meta http-equiv="refresh" content="0;url=https://evil/" /><p>ok</p>',
    );
    expect(out).not.toContain("http-equiv");
  });

  it("drops javascript: and data: URLs but keeps https/mailto/tel", () => {
    const out = sanitizeSignatureHtml(
      '<a href="javascript:alert(1)">a</a><a href="data:text/html,x">b</a><a href="https://cleanstart.com">c</a>',
    );
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("data:text/html");
    expect(out).toContain("https://cleanstart.com");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeSignatureHtml("")).toBe("");
  });
});
