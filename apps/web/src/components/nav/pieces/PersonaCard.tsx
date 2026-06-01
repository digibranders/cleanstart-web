import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Variant = "developer" | "ciso";

// One accent per persona — applied only to the glyph and the action link, the
// two places where color signals "this is the persona / this is the action".
// The surface itself is the shared neutral card, so cards read as one system.
const ACCENT: Record<Variant, string> = {
  developer: "#2cc1eb",
  ciso: "#6cffc2",
};

type Props = {
  href: string;
  variant: Variant;
  icon: string;
  label: string;
  description: string;
};

export function PersonaCard({ href, variant, icon, label, description }: Props) {
  const accent = ACCENT[variant];
  return (
    <Link
      href={href}
      className="cs-tile-glass flex min-h-[150px] flex-col rounded-[14px] border border-white/[0.06] p-4 transition-colors duration-200 ease-out hover:border-white/[0.10]"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.06] bg-white/[0.04]"
        style={{ color: accent }}
      >
        <NavIcon id={icon} size={18} />
      </div>
      <div className="mt-3.5 text-[14px] font-bold text-white">{label}</div>
      <div className="mt-1 text-xs leading-snug text-white/65">{description}</div>
      <div className="mt-auto pt-3.5 text-[11px] font-semibold" style={{ color: accent }}>
        Explore →
      </div>
    </Link>
  );
}
