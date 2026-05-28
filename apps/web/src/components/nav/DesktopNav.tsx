"use client";

import type React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { NAV_TREE, type NavItem, type NavMegaItem } from "@/lib/nav-config";
import { useIsActiveSection } from "@/components/nav/useIsActiveSection";
import { PanelProducts } from "@/components/nav/panels/PanelProducts";
import { PanelSolutions } from "@/components/nav/panels/PanelSolutions";
import { PanelAudience } from "@/components/nav/panels/PanelAudience";
import { PanelResources } from "@/components/nav/panels/PanelResources";
import { PanelCompany } from "@/components/nav/panels/PanelCompany";

const PANELS: Record<string, (props: { item: NavMegaItem }) => React.ReactElement> = {
  Products: PanelProducts,
  Solutions: PanelSolutions,
  Audience: PanelAudience,
  Resources: PanelResources,
  Company: PanelCompany,
};

function collectHrefs(item: NavItem): string[] {
  if (item.kind === "flat") return [item.href];
  if (item.kind === "compact") return item.items.map((i) => i.href);
  if (item.kind === "mega") return item.groups.flatMap((g) => g.items.map((i) => i.href));
  item satisfies never;
  return [];
}

function TopLevelItem({ item }: { item: NavItem }) {
  const active = useIsActiveSection(collectHrefs(item));

  if (item.kind === "flat") {
    const flatClass =
      "cs-nav-link relative inline-flex cursor-pointer items-center text-base font-medium leading-none text-white/85 transition-colors hover:text-white data-[active=true]:text-white after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#2cc1eb] after:opacity-0 after:transition-opacity data-[active=true]:after:opacity-100";
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
      <NavigationMenuTrigger data-active={active}>
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        {item.kind === "mega" && PANELS[item.label]
          ? (() => { const Panel = PANELS[item.label]!; return <Panel item={item} />; })()
          : null}
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
