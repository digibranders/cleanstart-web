import type { CommunityImage } from "@/lib/api/community-images";

/**
 * Real, per-image attribute chips for the Products hero — every value is read
 * live from the catalog API for the image shown in the pull command: architecture,
 * license, and the API's non-FIPS featured tags (e.g. "Security Hardened"). No
 * fabricated/placeholder data (CVE/pull counts are placeholders upstream).
 *
 * Always one line (`flex-nowrap` + `overflow-hidden`). The hero column is widened
 * so common licenses (Apache-2.0 / MIT / BSD-2-Clause) show in full alongside the
 * other two chips. Only the license chip may shrink + ellipsis (with a hover
 * title) — that absorbs the rare long value ("PostgreSQL License") so the row
 * never wraps and the arch + featured chips stay fully visible.
 */
const CHIP =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-[6px] border border-white/[0.1] bg-white/[0.045] px-2 py-1 text-[10px] font-medium text-white/65";
const LICENSE_CHIP =
  "block min-w-0 shrink truncate rounded-[6px] border border-white/[0.1] bg-white/[0.045] px-2 py-1 text-[10px] font-medium text-white/65";

export function ImageMeta({ image }: { image: CommunityImage }) {
  const arch =
    image.architecture && image.architecture.length > 0
      ? image.architecture.join(" · ")
      : null;
  const featured = image.featuredTags ?? [];

  if (!arch && !image.license && featured.length === 0) return null;

  return (
    <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
      {arch && <span className={CHIP}>{arch}</span>}
      {image.license && (
        <span className={LICENSE_CHIP} title={image.license}>
          {image.license}
        </span>
      )}
      {featured.map((label, i) => (
        <span key={`${label}-${i}`} className={CHIP}>
          {label}
        </span>
      ))}
    </div>
  );
}
