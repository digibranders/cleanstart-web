import { BulletSpark } from "@/components/icons/BulletSpark";
import { BulletSnowflake } from "@/components/icons/BulletSnowflake";
import { CubeIcon } from "@/components/icons/CubeIcon";
import { LogoMark } from "@/components/icons/Logo";

export interface ComparisonCardProps {
  variant: "public" | "cleanstart";
  title: string;
  bullets: string[];
}

export function ComparisonCard({ variant, title, bullets }: ComparisonCardProps) {
  const isCleanStart = variant === "cleanstart";
  const Bullet = isCleanStart ? BulletSpark : BulletSnowflake;
  const HeaderIcon = isCleanStart ? LogoMark : CubeIcon;

  return (
    // eslint-disable-next-line no-restricted-syntax -- v3 exception: anchored Figma spec inside a constrained component (button/pill/badge/card internal). See RESPONSIVE-AUDIT.md §14.3.
    <div className="cs-cmp-card relative w-[622px] overflow-hidden rounded-[40px]">
      <div
        className={`flex h-[112px] items-center justify-center gap-3 ${
          isCleanStart ? "cs-cmp-cleanstart-header" : "cs-cmp-public-header"
        }`}
      >
        {/* eslint-disable-next-line no-restricted-syntax -- v3 exception: 22px icon-sized square, not a card width. See RESPONSIVE-AUDIT.md §14.3. */}
        <HeaderIcon className="h-[22px] w-[22px]" />
        <span className="font-display text-2xl font-semibold tracking-[-0.02em] text-white">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-5 px-12 py-9">
        {bullets.map((b) => (
          <div key={b} className="flex items-center gap-4">
            <Bullet className="shrink-0" />
            <span className="text-base font-medium leading-[1.4] tracking-[-0.01em] text-[#111111]/85">
              {b}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
