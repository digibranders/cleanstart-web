import { FileSearch } from "lucide-react";

import { Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

import { NOTE } from "./content";

const ESCAPE = /[.*+?^${}()|[\]\\]/g;
const SOURCES = new RegExp(`(${NOTE.sources.map((source) => source.replace(ESCAPE, "\\$&")).join("|")})`, "g");

/** The note's own words, with the named source types set in heavier type. */
function NoteText(): React.ReactElement {
  const known: ReadonlySet<string> = new Set(NOTE.sources);
  return (
    <>
      {NOTE.text.split(SOURCES).map((part, index) =>
        known.has(part) ? (
          <strong key={`${part}-${index}`} style={{ fontWeight: 600, color: "#111" }}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * How the research was put together. It is a note about the whole report, so it
 * gets its own quiet strip between the quote and the company band, on a tinted
 * ground that reads as apart from both.
 */
export function Note(): React.ReactElement {
  return (
    <section data-section="ReportNote" aria-label="About the research" style={{ background: "#F6F6F6" }}>
      <Container>
        <Reveal y={16} className="flex items-start gap-4 py-8 sm:items-center sm:gap-5 lg:py-10">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6A3DF0]"
            style={{
              background:
                "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, rgba(154,81,255,0.55) 0%, rgba(44,193,235,0.55) 100%) border-box",
              border: "1.5px solid transparent",
            }}
          >
            <FileSearch size={20} strokeWidth={1.75} />
          </span>
          <p
            className="max-w-[78ch]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              lineHeight: 1.6,
              letterSpacing: "-0.01em",
              color: "rgba(17,17,17,0.72)",
              textWrap: "pretty",
            }}
          >
            <NoteText />
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
