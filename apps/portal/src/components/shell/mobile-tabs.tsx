"use client";

import Link from "next/link";
import { Icon } from "../icon";
import type { NavItem } from "@/lib/routes";

/** What the bar shows first, by page. A role that lacks some of these gets the next pages of its own sidebar instead, so the bar is always four useful places. */
const PREFERRED = ["/overview", "/deals", "/approvals", "/documents", "/messages"];
const SLOTS = 4;

/** The four pages for the bar, in sidebar order: the preferred ones this person may open, then the first others. */
export function tabItems(nav: readonly NavItem[]): NavItem[] {
  const preferred = nav.filter((item) => PREFERRED.some((tail) => item.href.endsWith(tail)));
  const rest = nav.filter((item) => !preferred.includes(item) && !item.href.endsWith("/deals/new") && !item.href.endsWith("/help"));
  return [...preferred, ...rest].slice(0, SLOTS).sort((a, b) => nav.indexOf(a) - nav.indexOf(b));
}

/** A short buzz on Android when a tab is tapped, like a system tab bar. iOS Safari has no vibration API, so nothing happens there. */
const tick = (): void => {
  navigator.vibrate?.(6);
};

interface MobileTabsProps {
  nav: readonly NavItem[];
  activeHref: string | null;
  /** Count text per nav item href (messages unread, deals waiting); empty string for none. */
  countFor: (item: NavItem) => string;
  moreOpen: boolean;
  onMore: () => void;
}

/**
 * The phone's main navigation: four pages and More, in a floating bar like an iOS tab bar. More opens the same panel the sidebar is on a
 * desktop, as a sheet from the bottom, with every page and the account links. Hidden above 760px by CSS.
 */
export function MobileTabs({ nav, activeHref, countFor, moreOpen, onMore }: MobileTabsProps): React.JSX.Element {
  const tabs = tabItems(nav);
  const inBar = tabs.some((item) => item.href === activeHref);
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((item) => {
        const on = item.href === activeHref;
        const count = countFor(item);
        return (
          <Link key={item.href} href={item.href} className={`tab-i${on ? " tab-on" : ""}`} aria-current={on ? "page" : undefined} onClick={tick}>
            <span className="tab-ic">
              <Icon name={item.icon} />
              {count ? (
                <span className="tab-cnt" aria-label={`${count} waiting`}>
                  {count}
                </span>
              ) : null}
            </span>
            <span className="tab-l">{item.label}</span>
          </Link>
        );
      })}
      <button type="button" className={`tab-i${moreOpen || !inBar ? " tab-on" : ""}`} onClickCapture={tick} aria-haspopup="dialog" aria-expanded={moreOpen} onClick={onMore}>
        <span className="tab-ic">
          <Icon name="more" />
        </span>
        <span className="tab-l">More</span>
      </button>
    </nav>
  );
}
