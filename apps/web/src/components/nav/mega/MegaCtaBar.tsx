import Link from "next/link";
import type { ReactNode } from "react";
import { MegaArrowButton } from "@/components/nav/mega/MegaArrowButton";

type Props = {
  href: string;
  headline: string;
  sub: string;
  ctaLabel: string;
  /** External destination — opens in a new tab, arrow renders diagonal. */
  external?: boolean;
  /** Optional live-data node rendered between the copy and the CTA (e.g. a docker-pull chip). */
  aside?: ReactNode;
};

/**
 * Full-width mega-menu CTA bar (v2 — Figma node 1672:1420): the brighter indigo
 * glow, headline + sub on the left, a cyan action label + circular arrow button
 * on the right, with an optional live-data slot in between.
 */
export function MegaCtaBar({ href, headline, sub, ctaLabel, external = false, aside }: Props) {
  const className =
    "cs-mega-cta group/cta relative flex items-center gap-4 overflow-hidden rounded-[16px] px-5 py-4";
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-tight text-white/90">{headline}</div>
        <div className="mt-1 text-xs leading-snug text-white/55">{sub}</div>
      </div>
      {aside && <div className="hidden shrink-0 xl:block">{aside}</div>}
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[15px] font-bold leading-none text-[#63bde6]">{ctaLabel}</span>
        <MegaArrowButton direction={external ? "up-right" : "right"} size={40} />
      </div>
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
