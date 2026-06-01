import type { CommunityImage } from "@/lib/api/community-images";

/**
 * Real, per-image attribute chips for the Products hero — every value is read
 * live from the community-images API for the image shown in the pull command:
 * architecture, license, and the API's curated non-FIPS featured tags. No
 * fabricated or placeholder data (CVE/pull counts are placeholders upstream and
 * are deliberately not surfaced). Renders nothing when the image carries none.
 */
const CHIP =
  "cs-chip inline-flex items-center rounded-[6px] px-2 py-1 text-[10px] font-semibold text-white/70";

export function ImageMeta({ image }: { image: CommunityImage }) {
  const chips: string[] = [];
  if (image.architecture && image.architecture.length > 0) {
    chips.push(image.architecture.join(" · "));
  }
  if (image.license) {
    chips.push(image.license);
  }
  if (image.featuredTags) {
    chips.push(...image.featuredTags);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((label, i) => (
        <span key={`${label}-${i}`} className={CHIP}>
          {label}
        </span>
      ))}
    </div>
  );
}
