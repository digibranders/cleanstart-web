import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GtmHeadScript } from "./GtmHeadScript";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GtmHeadScript", () => {
  it("renders nothing when the container id is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    expect(renderToStaticMarkup(<GtmHeadScript />)).toBe("");
  });

  it("renders nothing when the container id is malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "G-S6T47D7PZR");
    expect(renderToStaticMarkup(<GtmHeadScript />)).toBe("");
  });

  it("renders the inline bootstrap for a valid container id", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-ABC1234");
    const html = renderToStaticMarkup(<GtmHeadScript />);
    expect(html).toMatch(/^<script id="gtm-bootstrap">/);
    expect(html).toContain("googletagmanager.com/gtm.js?id=GTM-ABC1234");
  });
});
