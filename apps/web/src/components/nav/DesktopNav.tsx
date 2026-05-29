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
import type { CommunityImage } from "@/lib/api/community-images";
import type { FeedSource } from "@/components/nav/data/latest-updates-feed";
import type { SpotlightCard } from "@/components/nav/data/spotlights";

type Props = {
  latestImages: CommunityImage[];
  latestUpdates: FeedSource[];
  resourcesSpotlight: SpotlightCard;
  companySpotlight: SpotlightCard;
};

// Fallback panel map for mega items not handled by explicit branches
const PANELS: Record<
  string,
  (props: { item: NavMegaItem }) => React.ReactElement
> = {
  Solutions: PanelSolutions,
  Audience: PanelAudience,
};

function collectHrefs(item: NavItem): string[] {
  if (item.kind === "flat") return [item.href];
  if (item.kind === "compact") return item.items.map((i) => i.href);
  if (item.kind === "mega") return item.groups.flatMap((g) => g.items.map((i) => i.href));
  item satisfies never;
  return [];
}

function TopLevelItem({
  item,
  latestImages,
  latestUpdates,
  resourcesSpotlight,
  companySpotlight,
}: { item: NavItem } & Props) {
  const active = useIsActiveSection(collectHrefs(item));

  if (item.kind === "flat") {
    const flatClass =
      "cs-nav-link inline-flex cursor-pointer items-center text-base font-medium leading-none text-white/85 transition-colors hover:text-white data-[active=true]:text-white";
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

  let body: React.ReactElement | null = null;
  if (item.kind === "mega") {
    if (item.label === "Products") {
      body = <PanelProducts item={item} latestImages={latestImages} />;
    } else if (item.label === "Resources") {
      body = (
        <PanelResources
          item={item}
          latestUpdates={latestUpdates}
          spotlight={resourcesSpotlight}
        />
      );
    } else if (item.label === "Company") {
      body = <PanelCompany item={item} spotlight={companySpotlight} />;
    } else if (PANELS[item.label]) {
      const Panel = PANELS[item.label]!;
      body = <Panel item={item} />;
    }
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger data-active={active}>{item.label}</NavigationMenuTrigger>
      <NavigationMenuContent>{body}</NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function DesktopNav({
  latestImages,
  latestUpdates,
  resourcesSpotlight,
  companySpotlight,
}: Props) {
  return (
    <NavigationMenu className="hidden lg:flex" align="center" delay={120} closeDelay={200}>
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => (
          <TopLevelItem
            key={item.label}
            item={item}
            latestImages={latestImages}
            latestUpdates={latestUpdates}
            resourcesSpotlight={resourcesSpotlight}
            companySpotlight={companySpotlight}
          />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
