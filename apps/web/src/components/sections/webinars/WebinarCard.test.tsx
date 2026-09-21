import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Webinar } from "@/lib/webinars";
import { WebinarCard } from "./WebinarCard";

const base: Webinar = {
  id: "1",
  title: "Secure Containers, End to End",
  slug: "secure-containers",
  webinarType: "live",
  region: "north-america",
  startsAt: "2026-12-01T09:00:00.000Z",
  registrationMode: "external",
  registrationUrl: "https://web.bigmarker.com/cleanstart/secure-containers",
  eventStatus: "scheduled",
};

const render = (item: Webinar): string =>
  renderToStaticMarkup(<WebinarCard item={item} />);

describe("WebinarCard call to action", () => {
  it("asks an upcoming webinar's visitor to register", () => {
    const html = render(base);
    expect(html).toContain("Register");
    expect(html).not.toContain("Watch on-demand");
    expect(html).toContain(base.registrationUrl as string);
  });

  it("asks an on-demand webinar's visitor to watch, and prefers the recording", () => {
    const html = render({
      ...base,
      webinarType: "on-demand",
      recordingUrl: "https://videos.cleanstart.com/secure-containers",
    });
    expect(html).toContain("Watch on-demand");
    expect(html).not.toContain(">Register");
    expect(html).toContain("https://videos.cleanstart.com/secure-containers");
  });

  it("falls back to the registration URL when no recording is stored", () => {
    // BigMarker serves the replay from the same registration page.
    const html = render({ ...base, webinarType: "on-demand" });
    expect(html).toContain("Watch on-demand");
    expect(html).toContain(base.registrationUrl as string);
  });

  it("says the recording is coming when an on-demand webinar has no link", () => {
    const html = render({ ...base, webinarType: "on-demand", registrationUrl: null });
    expect(html).toContain("Recording coming soon");
    expect(html).not.toContain("<a href");
  });
});
