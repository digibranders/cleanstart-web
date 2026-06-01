import type { CommunityImage } from "@/lib/api/community-images";

/**
 * Real, per-image attribute chips for the Products hero — every value is read
 * live from the catalog API for the image shown in the pull command.
 *
 * We show architecture + license only. Both are genuine per-image attributes
 * (license varies: Apache-2.0 / BSD-2-Clause / PostgreSQL License …). The API's
 * "Security Hardened" featured tag is intentionally omitted here: it's constant
 * on every image (no per-image signal) and a third chip can't fit on one line in
 * the hero's ~260px column for long license names — these two always fit. No
 * fabricated/placeholder data (CVE/pull counts are placeholders upstream).
 */
const CHIP =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-[6px] border border-white/[0.1] bg-white/[0.045] px-2 py-1 text-[10px] font-medium text-white/65";

export function ImageMeta({ image }: { image: CommunityImage }) {
  const chips: string[] = [];
  if (image.architecture && image.architecture.length > 0) {
    chips.push(image.architecture.join(" · "));
  }
  if (image.license) {
    chips.push(image.license);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
      {chips.map((label, i) => (
        <span key={`${label}-${i}`} className={CHIP}>
          {label}
        </span>
      ))}
    </div>
  );
}
