import Link from "next/link";
import { NavIcon } from "@/components/nav/icons/NavIcon";

type Variant = "developer" | "ciso";

const STYLES: Record<
  Variant,
  { bg: string; border: string; iconBg: string; iconColor: string; link: string }
> = {
  developer: {
    bg: "rgba(44,193,235,0.06)",
    border: "rgba(44,193,235,0.18)",
    iconBg: "rgba(44,193,235,0.10)",
    iconColor: "#2cc1eb",
    link: "#2cc1eb",
  },
  ciso: {
    bg: "rgba(108,255,194,0.05)",
    border: "rgba(108,255,194,0.18)",
    iconBg: "rgba(108,255,194,0.10)",
    iconColor: "#6cffc2",
    link: "#6cffc2",
  },
};

type Props = {
  href: string;
  variant: Variant;
  icon: string;
  label: string;
  description: string;
};

export function PersonaCard({ href, variant, icon, label, description }: Props) {
  const s = STYLES[variant];
  return (
    <Link
      href={href}
      className="flex min-h-[150px] flex-col rounded-[12px] border p-4 transition-colors hover:bg-white/[0.02]"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border"
        style={{ background: s.iconBg, borderColor: s.border, color: s.iconColor }}
      >
        <NavIcon id={icon} size={18} />
      </div>
      <div className="mt-3.5 text-[14px] font-bold text-white">{label}</div>
      <div className="mt-1 text-xs leading-snug text-white/65">{description}</div>
      <div className="mt-auto pt-3.5 text-[11px] font-semibold" style={{ color: s.link }}>
        Explore →
      </div>
    </Link>
  );
}
