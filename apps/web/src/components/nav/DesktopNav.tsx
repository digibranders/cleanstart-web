"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { NAV_TREE, type NavItem } from "@/lib/nav-config";
import { MegaMenu } from "@/components/nav/MegaMenu";
import { useIsActiveSection } from "@/components/nav/useIsActiveSection";

function collectHrefs(item: NavItem): string[] {
  if (item.kind === "flat") return [item.href];
  if (item.kind === "compact") return item.items.map((i) => i.href);
  return item.groups.flatMap((g) => g.items.map((i) => i.href));
}

function TopLevelItem({ item }: { item: NavItem }) {
  const active = useIsActiveSection(collectHrefs(item));

  if (item.kind === "flat") {
    const flatClass =
      "cs-nav-link relative inline-flex cursor-pointer items-center text-base font-medium leading-none text-white/85 transition-colors hover:text-white data-[active=true]:text-white";
    return (
      <NavigationMenuItem>
        {item.built !== false ? (
          <Link href={item.href} className={flatClass} data-active={active}>
            {item.label}
          </Link>
        ) : (
          <span className={flatClass} data-active={active}>
            {item.label}
          </span>
        )}
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={navigationMenuTriggerStyle()}
        data-active={active}
      >
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <MegaMenu
          groups={
            item.kind === "mega" ? item.groups : [{ items: item.items }]
          }
          activeLabel={item.label}
          {...(item.width !== undefined ? { width: item.width } : {})}
        />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function DesktopNav() {
  return (
    <NavigationMenu className="hidden lg:flex" align="center" delay={120} closeDelay={200}>
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => (
          <TopLevelItem key={item.label} item={item} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
