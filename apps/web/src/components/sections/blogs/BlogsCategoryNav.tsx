"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogCategory } from "@/lib/blog";

/**
 * Category pill row for the blogs hero. Reads the active category straight from
 * the URL (`useSearchParams`) so it stays in sync on client-side navigation: the
 * hero is rendered once OUTSIDE the listing's `<Suspense>` boundary (to keep a
 * single <h1> in the streamed HTML), so it can't receive the active category as
 * a prop from the client browser. Must be wrapped in `<Suspense>` by the caller
 * (BlogsHero does) because `useSearchParams` opts into client rendering.
 */
export function BlogsCategoryNav({
  categories,
}: {
  categories: BlogCategory[];
}): React.ReactElement {
  const active = useSearchParams().get("category") ?? "";
  return (
    <nav
      className="-mx-6 sm:mx-0 lg:flex-wrap lg:justify-center flex items-center gap-[10px] overflow-x-auto lg:overflow-visible px-6 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-screen sm:w-auto"
      aria-label="Blog categories"
    >
      <CategoryPill label="All" href="/blogs" active={active === ""} />
      {categories.map((cat) => (
        <CategoryPill
          key={cat.id}
          label={cat.name}
          href={`/blogs?category=${cat.slug}`}
          active={active === cat.slug}
        />
      ))}
    </nav>
  );
}

function CategoryPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="cs-category-pill flex items-center justify-center font-sans font-normal text-white shrink-0"
      style={{
        height: "32px",
        padding: "6px 16px",
        borderRadius: "30px",
        background: active ? "rgba(196,70,239,0.6)" : "rgba(196,70,239,0.2)",
        // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
        fontSize: "var(--fs-body-sm)",
        lineHeight: "1.0",
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
      }}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
