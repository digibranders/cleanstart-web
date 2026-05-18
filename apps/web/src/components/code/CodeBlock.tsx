import { CopyButton } from "./CopyButton";
import { parseHighlightLines } from "./parseHighlightLines";

interface CodeBlockProps {
  language?: string | null | undefined;
  content: string;
  /**
   * Pre-rendered HTML for each source line, produced server-side by
   * `lib/highlightLexical.ts`. When absent (e.g. unprocessed content),
   * the component falls back to escaped plain text.
   */
  lines?: string[] | undefined;
  showLineNumbers?: boolean | null | undefined;
  highlightLines?: string | null | undefined;
}

const LANGUAGE_LABEL: Record<string, string> = {
  bash: "Bash",
  dockerfile: "Dockerfile",
  yaml: "YAML",
  json: "JSON",
  typescript: "TypeScript",
  tsx: "TSX",
  javascript: "JavaScript",
  jsx: "JSX",
  python: "Python",
  go: "Go",
  rust: "Rust",
  sql: "SQL",
  hcl: "HCL",
  text: "Text",
};

function escapePlain(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function CodeBlock({
  language,
  content,
  lines,
  showLineNumbers,
  highlightLines,
}: CodeBlockProps) {
  const lang = (language ?? "text").toLowerCase();
  const label = LANGUAGE_LABEL[lang] ?? (language ? language.toUpperCase() : "Text");
  const highlights = parseHighlightLines(highlightLines);
  const showNumbers = showLineNumbers !== false;

  const renderedLines: string[] =
    lines && lines.length > 0
      ? lines
      : content.split("\n").map((line) => escapePlain(line || " "));

  return (
    <section
      className="cs-code not-prose"
      aria-label={`${label} code sample`}
    >
      <div className="cs-code__floating-copy">
        <CopyButton value={content} />
      </div>
      <pre
        className="cs-code__pre"
        data-line-numbers={showNumbers ? "" : undefined}
        data-language={lang}
      >
        <code className="cs-code__code">
          {renderedLines.map((html, index) => {
            const lineNumber = index + 1;
            const isHighlighted = highlights.has(lineNumber);
            return (
              <span
                key={`line-${lineNumber}`}
                className="cs-code__line"
                data-highlight={isHighlighted ? "" : undefined}
              >
                {showNumbers ? (
                  <span className="cs-code__line-no" aria-hidden="true">
                    {lineNumber}
                  </span>
                ) : null}
                <span
                  className="cs-code__line-content"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: server-escaped Shiki token spans
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </span>
            );
          })}
        </code>
      </pre>
    </section>
  );
}
