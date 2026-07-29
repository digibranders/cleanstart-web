"use client";

import { useId, useMemo, useState } from "react";

import { SignatureCard } from "@/components/sections/email-signatures/SignatureCard";
import {
  filterSignatures,
  groupSignatures,
  type EmailSignatureSummary,
} from "@/lib/email-signatures-utils";

/**
 * The searchable directory grid.
 *
 * Filtering happens in the browser against the roster the page already
 * rendered — the whole company is one small list, so a URL-driven search
 * (`_shared/SearchBar`) would cost a round-trip and an ISR revalidate per
 * keystroke to narrow a list that is already in the DOM.
 */
export function SignatureDirectory({
  signatures,
}: {
  signatures: EmailSignatureSummary[];
}): React.ReactElement {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const groups = useMemo(
    () => groupSignatures(filterSignatures(signatures, query)),
    [signatures, query],
  );

  if (signatures.length === 0) {
    return (
      <p className="mt-10 text-[length:var(--fs-body)] text-white/50">
        No signatures have been published yet.
      </p>
    );
  }

  const matchCount = groups.reduce((total, entry) => total + entry.people.length, 0);
  const isSearching = query.trim().length > 0;

  return (
    <>
      <search aria-label="Signature directory" className="mt-8 block">
        <label className="sr-only" htmlFor={inputId}>
          Search signatures by name, job title, email or team
        </label>
        <div className="relative w-full max-w-[420px]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
            placeholder="Search by name, title or team…"
            autoComplete="off"
            // 16px minimum, or iOS Safari zooms the page on focus.
            className="h-11 w-full rounded-[10px] border border-white/[0.12] bg-white/[0.04] pl-11 pr-4 text-[16px] leading-[1.5] text-white outline-none transition-colors placeholder:text-white/40 focus:border-[var(--color-cs-cyan)]/70 focus:bg-white/[0.06] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
        <p
          aria-live="polite"
          className="mt-3 min-h-[1.25em] text-[length:var(--fs-caption)] text-white/45"
        >
          {isSearching
            ? `${matchCount} of ${signatures.length} ${signatures.length === 1 ? "person" : "people"}`
            : ""}
        </p>
      </search>

      {matchCount === 0 ? (
        <p className="mt-6 text-[length:var(--fs-body)] text-white/50">
          No one matches “{query.trim()}”.{" "}
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[var(--color-cs-cyan)] underline underline-offset-4 hover:text-white"
          >
            Clear search
          </button>
        </p>
      ) : (
        <div className="mt-6 space-y-11">
          {groups.map(({ group, people }) => (
            <section key={group}>
              {/* Quiet label + hairline rather than a display heading: this is a
                  directory people scan, so the groups should organise the grid
                  without competing with the names. */}
              <div className="flex items-center gap-4">
                <h2 className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {group}
                </h2>
                <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
              </div>
              <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                {people.map((person) => (
                  <SignatureCard key={person.slug} person={person} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
