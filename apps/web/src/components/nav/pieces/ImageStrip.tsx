import { ImageMeta } from "@/components/nav/pieces/ImageMeta";
import { CopyableCommand } from "@/components/nav/pieces/CopyableCommand";
import { ArrowGlyph } from "@/components/nav/pieces/ArrowGlyph";
import type { CommunityImage } from "@/lib/api/community-images";

type Props = { image: CommunityImage | undefined; href: string; label: string };

/**
 * Catalog strip along the foot of the Products panel: the pitch, the latest
 * image's live pull command, and the one exit to the catalog. Without an image
 * (feed down) it keeps the pitch and the link.
 */
export function ImageStrip({ image, href, label }: Props) {
  return (
    <div className="mt-3.5 flex items-center gap-4 rounded-[12px] bg-white/[0.03] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="w-[236px] shrink-0">
        <div className="whitespace-nowrap text-[13px] font-semibold leading-tight text-white/90">
          Stop patching. Replace the base.
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-white/50">Drop-in hardened images.</div>
      </div>

      <div className="min-w-0 flex-1">
        {image && (
          <div className="flex flex-col gap-2">
            <ImageMeta image={image} />
            <CopyableCommand command={`$ docker pull cleanstart/${image.name}:latest`} />
          </div>
        )}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group/cta ml-auto flex shrink-0 items-center gap-1.5 self-stretch border-l border-white/[0.07] pl-4 text-[12.5px] font-semibold text-[#2cc1eb]"
      >
        {label}
        <ArrowGlyph direction="up-right" size={13} />
      </a>
    </div>
  );
}
