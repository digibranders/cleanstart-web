"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

export function BlogsHeroSearch({
  initialQuery,
}: {
  initialQuery: string;
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const q = inputRef.current?.value.trim() ?? "";
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center"
      role="search"
      aria-label="Search blogs"
    >
      {/* Input */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "622px",
          height: "42px",
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(237,203,255,0.6)",
          borderRight: "none",
          borderRadius: "12px 0 0 12px",
        }}
      >
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search blogs...."
          className="absolute inset-0 w-full h-full bg-transparent px-[14px] text-white placeholder:text-white/60 font-sans text-[16px] leading-[1.5] outline-none"
          style={{ fontWeight: 400 }}
        />
      </div>

      {/* Search button */}
      <button
        type="submit"
        aria-label="Search"
        className="relative flex items-center justify-center shrink-0 overflow-hidden"
        style={{ width: "52px", height: "42px", borderRadius: "0 12px 12px 0" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/search-button.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />
      </button>
    </form>
  );
}
