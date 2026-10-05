import { describe, expect, it } from "vitest";

import { prepareLogoSvg } from "./logo";

const svg = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;

describe("prepareLogoSvg", () => {
  it("drops the dark-mode block so the logo keeps its light ink", () => {
    const input = svg(
      "<style>.st0{fill:black} @media (prefers-color-scheme: dark) { .st0{fill:white} } .st1{fill:#f90}</style><path class=\"st0\" d=\"M0 0\"/>",
    );
    const out = prepareLogoSvg(input);
    expect(out?.changed).toBe(true);
    expect(out?.svg).not.toContain("prefers-color-scheme");
    expect(out?.svg).toContain(".st0{fill:black}");
    expect(out?.svg).toContain(".st1{fill:#f90}");
    expect(out?.tone).toBe("light");
  });

  it("leaves an ordinary logo untouched", () => {
    const input = svg('<path fill="#f90" d="M0 0"/>');
    const out = prepareLogoSvg(input);
    expect(out).toEqual({ svg: input, tone: "light", changed: false });
  });

  it("puts a white-only logo on the dark tile", () => {
    expect(prepareLogoSvg(svg('<path fill="#FFF" d="M0 0"/><path fill="white" d="M1 1"/>'))?.tone).toBe("dark");
  });

  it("keeps a logo that mixes white with colour on the light tile", () => {
    expect(prepareLogoSvg(svg('<path fill="#fff" d="M0 0"/><path fill="#f90" d="M1 1"/>'))?.tone).toBe("light");
  });

  it("treats a logo with no explicit fill as black ink", () => {
    expect(prepareLogoSvg(svg('<path d="M0 0"/>'))?.tone).toBe("light");
  });

  it("handles a dark-mode block that is not the last rule", () => {
    const out = prepareLogoSvg(svg("<style>@media (prefers-color-scheme:dark){.a{fill:white}}.b{fill:#123456}</style>"));
    expect(out?.svg).toContain(".b{fill:#123456}");
    expect(out?.svg).not.toContain("white");
  });

  it("refuses text that is not an SVG or that carries script", () => {
    expect(prepareLogoSvg("<html><body>404</body></html>")).toBeNull();
    expect(prepareLogoSvg(svg("<script>alert(1)</script>"))).toBeNull();
    expect(prepareLogoSvg(svg('<path onload="x()" d="M0 0"/>'))).toBeNull();
  });
});
