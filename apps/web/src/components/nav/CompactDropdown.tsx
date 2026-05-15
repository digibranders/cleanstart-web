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
          <li key={item.label}>
            {item.built ? (
              <Link
                href={item.href}
                className="block rounded-[10px] px-3 py-2.5 text-sm font-medium leading-tight text-white/90 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span className="block rounded-[10px] px-3 py-2.5 text-sm font-medium leading-tight text-white/90 cursor-default">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
