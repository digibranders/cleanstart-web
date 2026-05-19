import "server-only";

import type { BundledLanguage } from "shiki";
import { createHighlighter } from "shiki";

import { cleanstartCodeTheme } from "./theme";

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;

// Curated languages mirror the options in apps/cms `CodeBlock` schema.
// "text" maps to plaintext at call-time; it's not a Shiki grammar.
export const SUPPORTED_LANGUAGES = [
  "bash",
  "dockerfile",
  "yaml",
  "json",
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "python",
  "go",
  "rust",
  "sql",
  "hcl",
] as const satisfies ReadonlyArray<BundledLanguage>;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number] | "text";

export function normalizeLanguage(input: string | null | undefined): SupportedLanguage {
  if (!input) return "text";
  const lower = input.toLowerCase();
  if (lower === "ts") return "typescript";
  if (lower === "js") return "javascript";
  if (lower === "py") return "python";
  if (lower === "sh" || lower === "shell" || lower === "zsh") return "bash";
  if (lower === "terraform") return "hcl";
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lower)) {
    return lower as SupportedLanguage;
  }
  return "text";
}

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [cleanstartCodeTheme],
      langs: [...SUPPORTED_LANGUAGES],
    });
  }
  return highlighterPromise;
}

export const THEME_NAME = "cleanstart-dark";
