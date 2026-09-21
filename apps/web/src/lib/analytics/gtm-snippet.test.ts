// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { buildGtmSnippet } from "./gtm-snippet";

const ID = "GTM-ABC1234";
const LOADER = 'script[src*="googletagmanager.com/gtm.js"]';

type TestWindow = Window &
  typeof globalThis & {
    dataLayer?: unknown[] | undefined;
    happyDOM: {
      setURL: (url: string) => void;
      settings: { handleDisabledFileLoadingAsSuccess: boolean };
    };
  };

const win = () => globalThis.window as TestWindow;

/** Runs the snippet as a top-level classic script, the way the browser does. */
function runSnippetOn(hostname: string): void {
  win().happyDOM.setURL(`https://${hostname}/some/page`);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(buildGtmSnippet(ID)).call(win());
}

beforeEach(() => {
  win().happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
  document.head.innerHTML = "";
  win().dataLayer = undefined;
});

describe("buildGtmSnippet on an indexable host", () => {
  beforeEach(() => {
    runSnippetOn("www.cleanstart.com");
  });

  it("injects exactly one container loader for the configured id", () => {
    const loaders = document.head.querySelectorAll<HTMLScriptElement>(LOADER);
    expect(loaders).toHaveLength(1);
    expect(loaders[0]?.src).toBe(
      `https://www.googletagmanager.com/gtm.js?id=${ID}`,
    );
  });

  it("loads the container asynchronously so it never blocks parsing", () => {
    expect(document.head.querySelector<HTMLScriptElement>(LOADER)?.async).toBe(
      true,
    );
  });

  it("pushes the gtm.js start event the container expects", () => {
    const start = (win().dataLayer ?? []).find(
      (entry) => (entry as { event?: string }).event === "gtm.js",
    ) as { "gtm.start"?: unknown } | undefined;
    expect(typeof start?.["gtm.start"]).toBe("number");
  });
});

describe("buildGtmSnippet host gating", () => {
  // *.vercel.app aliases share the same production build, and therefore the same
  // baked-in NEXT_PUBLIC_GTM_ID, as www. This check is the only thing keeping
  // every tag in the container off preview traffic.
  it("loads no container on a Vercel preview alias", () => {
    runSnippetOn("cleanstart-web-git-development.vercel.app");
    expect(document.head.querySelector(LOADER)).toBeNull();
    expect(win().dataLayer).toBeUndefined();
  });

  it("matches noindex hosts case-insensitively", () => {
    runSnippetOn("CleanStart-Web.VERCEL.app");
    expect(document.head.querySelector(LOADER)).toBeNull();
  });

  it("does not treat a lookalike host as a preview alias", () => {
    runSnippetOn("vercel.app.cleanstart.com");
    expect(document.head.querySelector(LOADER)).not.toBeNull();
  });
});

describe("buildGtmSnippet consent ordering", () => {
  it("keeps the consent default queued by the head snippet ahead of the container", () => {
    const consentDefault = ["consent", "default", { ad_storage: "denied" }];
    win().dataLayer = [consentDefault];

    runSnippetOn("www.cleanstart.com");

    const queue = win().dataLayer ?? [];
    // Reassigning dataLayer would drop the default, and every tag would boot
    // with no consent state at all.
    expect(queue[0]).toBe(consentDefault);
    expect((queue[1] as { event?: string }).event).toBe("gtm.js");
  });
});
