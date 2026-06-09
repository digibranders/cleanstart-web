"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";

interface SearchBarProps {
  initialQuery: string;
  placeholder: string;
  ariaLabel: string;
  inputWidthClassName?: string;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 400;

export function SearchBar({
  initialQuery,
  placeholder,
  ariaLabel,
  inputWidthClassName,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: SearchBarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedQuery = useRef<string>(initialQuery);
  const [, startTransition] = useTransition();

  const pushQuery = useCallback(
    (q: string, navigate: "push" | "replace") => {
      if (q === lastPushedQuery.current) return;
      lastPushedQuery.current = q;
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      startTransition(() => {
        if (navigate === "replace") {
          router.replace(url, { scroll: false });
        } else {
          router.push(url, { scroll: false });
        }
      });
    },
    [router, pathname, searchParams],
  );

  const clearDebounce = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  useEffect(() => clearDebounce, [clearDebounce]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.currentTarget.value.trim();
      clearDebounce();
      debounceTimer.current = setTimeout(
        () => pushQuery(next, "replace"),
        debounceMs,
      );
    },
    [pushQuery, clearDebounce, debounceMs],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearDebounce();
      pushQuery(inputRef.current?.value.trim() ?? "", "push");
    },
    [pushQuery, clearDebounce],
  );

  const inputWrapperStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(237,203,255,0.6)",
    borderRight: "none",
    borderRadius: "12px 0 0 12px",
  };

  return (
    <search aria-label={ariaLabel} className="contents w-full">
      <form onSubmit={handleSubmit} className="flex items-center w-full max-w-[674px] mx-auto">
        <div
          className={`relative overflow-hidden flex-1 min-w-0 h-10 sm:h-11${
            inputWidthClassName ? ` ${inputWidthClassName}` : ""
          }`}
          style={inputWrapperStyle}
        >
          <input
            ref={inputRef}
            type="search"
            name="q"
            defaultValue={initialQuery}
            placeholder={placeholder}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-white placeholder:text-white/60 text-base leading-[1.5] outline-none"
            style={{ fontWeight: 400 }}
          />
        </div>
        <button
          type="submit"
          aria-label="Search"
          className="shrink-0 flex items-center justify-center cursor-pointer h-10 sm:h-11"
          style={{
            width: "52px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(237,203,255,0.6)",
            borderLeft: "none",
            borderRadius: "0 12px 12px 0",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>
    </search>
  );
}
