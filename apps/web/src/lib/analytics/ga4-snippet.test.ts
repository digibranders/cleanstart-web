// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { buildGa4Snippet } from "./ga4-snippet";

const ID = "G-S6T47D7PZR";

type TestWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[] | undefined;
    gtag?: ((...args: unknown[]) => void) | undefined;
    happyDOM: {
      setURL: (url: string) => void;
      settings: { handleDisabledFileLoadingAsSuccess: boolean };
    };
  };

const win = () => globalThis.window as TestWindow;

/**
 * Executes the snippet the way the browser does — as a top-level classic script
 * against the real document — so the assertions cover actual behaviour (host
 * gating, queue ordering, loader injection) rather than string matching.
 */
function runSnippetOn(hostname: string): void {
  win().happyDOM.setURL(`https://${hostname}/some/page`);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(buildGa4Snippet(ID)).call(win());
}

beforeEach(() => {
  // The loader points at a real CDN; happy-dom must not try to fetch it (and
  // must not log a DOMException for declining to).
  win().happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
  document.head.innerHTML = "";
  win().dataLayer = undefined;
  win().gtag = undefined;
});

describe("buildGa4Snippet on an indexable host", () => {
  beforeEach(() => {
    runSnippetOn("www.cleanstart.com");
  });

  it("injects the gtag.js loader for the configured measurement id", () => {
    const loader = document.head.querySelector<HTMLScriptElement>(
      'script[src*="googletagmanager.com/gtag/js"]',
    );
    expect(loader).not.toBeNull();
    expect(loader?.src).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${ID}`,
    );
  });

  it("loads the tag asynchronously so it never blocks parsing", () => {
    const loader = document.head.querySelector<HTMLScriptElement>(
      'script[src*="googletagmanager.com"]',
    );
    expect(loader?.async).toBe(true);
  });

  it("queues js + config on the dataLayer", () => {
    const queued = (win().dataLayer ?? []).map(
      (entry) => Array.from(entry as IArguments)[0],
    );
    expect(queued).toContain("js");
    expect(queued).toContain("config");
  });

  it("configures the property with the measurement id", () => {
    const config = (win().dataLayer ?? [])
      .map((entry) => Array.from(entry as IArguments))
      .find((args) => args[0] === "config");
    expect(config?.[1]).toBe(ID);
  });

  it("exposes a callable window.gtag for trackEvent()", () => {
    expect(typeof win().gtag).toBe("function");
  });
});

describe("buildGa4Snippet host gating", () => {
  // staging.cleanstart.com and *.vercel.app share the SAME production build (and
  // therefore the same baked-in NEXT_PUBLIC_GA4_ID) as www, so the runtime host
  // check is the only thing keeping their traffic out of the GA4 property.
  it.each([
    ["staging.cleanstart.com", "the noindex staging alias"],
    ["cleanstart-web-git-development.vercel.app", "a Vercel preview alias"],
  ])("loads no tag on %s (%s)", (hostname) => {
    runSnippetOn(hostname);
    expect(
      document.head.querySelector('script[src*="googletagmanager.com"]'),
    ).toBeNull();
    expect(win().dataLayer).toBeUndefined();
  });

  it("matches noindex hosts case-insensitively", () => {
    runSnippetOn("STAGING.CleanStart.com");
    expect(
      document.head.querySelector('script[src*="googletagmanager.com"]'),
    ).toBeNull();
  });

  it("does not treat a lookalike host as a preview alias", () => {
    runSnippetOn("vercel.app.cleanstart.com");
    expect(
      document.head.querySelector('script[src*="googletagmanager.com"]'),
    ).not.toBeNull();
  });
});

describe("buildGa4Snippet consent ordering", () => {
  it("preserves the consent default already queued by the head snippet", () => {
    win().dataLayer = [];
    const existing = (...args: unknown[]) => {
      (win().dataLayer as unknown[]).push(args);
    };
    win().gtag = existing;
    existing("consent", "default", { analytics_storage: "granted" });

    runSnippetOn("www.cleanstart.com");

    const first = Array.from(
      (win().dataLayer as unknown[])[0] as IArguments,
    );
    expect(first[0]).toBe("consent");
    // The consent snippet's gtag reference must survive, or ConsentProvider's
    // later `gtag('consent','update')` would push through a different queue.
    expect(win().gtag).toBe(existing);
  });
});
