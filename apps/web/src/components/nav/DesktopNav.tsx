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
import { NAV_TREE } from "@/lib/nav-config";
import { MegaMenu } from "@/components/nav/MegaMenu";

export function DesktopNav() {
  return (
    <NavigationMenu className="hidden lg:flex" align="center">
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => {
          if (item.kind === "flat") {
            const flatClass =
              "cs-nav-link relative inline-flex cursor-pointer items-center text-base font-medium leading-none text-white/85 transition-colors hover:text-white";
            return (
              <NavigationMenuItem key={item.label}>
                {item.built ? (
                  <Link href={item.href} className={flatClass}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={flatClass}>{item.label}</span>
                )}
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaMenu
                  groups={
                    item.kind === "mega"
                      ? item.groups
                      : [{ items: item.items }]
                  }
                  activeLabel={item.label}
                  {...(item.width !== undefined ? { width: item.width } : {})}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
