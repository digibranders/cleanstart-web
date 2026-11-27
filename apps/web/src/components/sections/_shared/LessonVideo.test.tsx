import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonVideo } from "./LessonVideo";

describe("LessonVideo", () => {
  it("renders the labelled player for the given MP4 URL", () => {
    const html = renderToStaticMarkup(
      <LessonVideo src="https://storage.googleapis.com/cleanstart-academy-videos/a.mp4" />,
    );
    expect(html).toContain("Watch the Lesson");
    expect(html).toContain('src="https://storage.googleapis.com/cleanstart-academy-videos/a.mp4"');
    expect(html).toContain("controls");
  });

  it("applies the caller's spacing class", () => {
    const html = renderToStaticMarkup(<LessonVideo src="https://example.com/a.mp4" className="mb-8" />);
    expect(html).toContain('class="mb-8"');
  });
});
