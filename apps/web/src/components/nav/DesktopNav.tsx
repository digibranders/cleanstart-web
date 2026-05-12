"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { NAV_TREE } from "@/lib/nav-config";
import { NavLink } from "@/components/nav/NavLink";
import { MegaMenu } from "@/components/nav/MegaMenu";
import { CompactDropdown } from "@/components/nav/CompactDropdown";

export function DesktopNav() {
  return (
    <NavigationMenu className="hidden xl:flex" align="center">
      <NavigationMenuList className="gap-7">
        {NAV_TREE.map((item) => {
          if (item.kind === "flat") {
            return (
              <NavigationMenuItem key={item.label}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                {item.kind === "mega" ? (
                  <MegaMenu groups={item.groups} {...(item.width !== undefined ? { width: item.width } : {})} />
                ) : (
                  <CompactDropdown items={item.items} {...(item.width !== undefined ? { width: item.width } : {})} />
                )}
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
