import Link from "next/link";
import type { NavLeaf } from "@/lib/nav-config";

export function CompactDropdown({
  items,
  width = 260,
}: {
  items: NavLeaf[];
  width?: number;
}) {
  return (
    <div className="cs-mega-surface" style={{ width }}>
      <ul className="flex flex-col p-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="cs-mega-item block rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium leading-tight text-white/90 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#33BAEC]/70"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
