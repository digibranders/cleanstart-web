import type { ThemeRegistrationRaw } from "shiki";

// CleanStart code theme — token colors are drawn from the brand tokens
// and accessible contrast pairs against the #0C131C surface.
export const cleanstartCodeTheme: ThemeRegistrationRaw = {
  name: "cleanstart-dark",
  type: "dark",
  colors: {
    "editor.background": "#0C131C",
    "editor.foreground": "#E2E8F0",
  },
  settings: [
    { settings: { background: "#0C131C", foreground: "#E2E8F0" } },
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "#6B7280", fontStyle: "italic" },
    },
    {
      scope: [
        "constant",
        "constant.numeric",
        "constant.language",
        "support.constant",
      ],
      settings: { foreground: "#FFB86C" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "#86E1A0" },
    },
    {
      scope: ["string.regexp"],
      settings: { foreground: "#FFB86C" },
    },
    {
      scope: ["variable", "support.variable", "meta.definition.variable"],
      settings: { foreground: "#E2E8F0" },
    },
    {
      scope: ["variable.parameter"],
      settings: { foreground: "#F0ABFC" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "storage",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#2CC1EB" },
    },
    {
      scope: ["keyword.operator", "punctuation"],
      settings: { foreground: "#94A3B8" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
      ],
      settings: { foreground: "#C4B5FD" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
      ],
      settings: { foreground: "#FDE68A" },
    },
    {
      scope: ["entity.name.tag", "meta.tag", "punctuation.definition.tag"],
      settings: { foreground: "#2CC1EB" },
    },
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#F0ABFC" },
    },
    {
      scope: ["meta.object-literal.key", "support.type.property-name"],
      settings: { foreground: "#7DD3FC" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#FCA5A5", fontStyle: "underline" },
    },
  ],
};
