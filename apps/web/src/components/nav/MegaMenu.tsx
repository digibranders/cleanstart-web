import type { NavGroup } from "@/lib/nav-config";

export function MegaMenu({
  groups,
  width = 520,
}: {
  groups: NavGroup[];
  width?: number;
}) {
  const showDescriptions = groups.some((g) =>
    g.items.some((i) => Boolean(i.description))
  );
  const columns = groups.length;

  return (
    <div
      className="cs-mega-surface"
      style={{ width }}
    >
      <div
        className="grid gap-x-4 gap-y-1 p-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            {group.title && (
              <div className="px-3 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                {group.title}
              </div>
            )}
            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.label}>
                  <span className="block rounded-[12px] px-3 py-2.5">
                    <div className="text-[14.5px] font-medium leading-tight text-white/95">
                      {item.label}
                    </div>
                    {showDescriptions && item.description && (
                      <div className="mt-1 text-[12.5px] leading-snug text-white/55">
                        {item.description}
                      </div>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
