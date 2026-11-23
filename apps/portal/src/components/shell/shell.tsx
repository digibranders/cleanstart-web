"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { settleAuth } from "@/lib/auth-call";
import { authClient } from "@/lib/auth-client";
import type { NotificationsDto, ShellDto } from "@/lib/dto";
import { initialsOf } from "@/lib/initials";
import { activeNavHref, joinWords, type NavItem, type PortalKind, ROUTES, searchNouns } from "@/lib/routes";
import { sendManagerMessageAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import { Avatar } from "../ui/badge";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { NotificationsPopover } from "./notifications-popover";
import { OPEN_SEARCH_EVENT, SearchPalette } from "./search-palette";
import { Scrim } from "@/components/ui/scrim";

const NARROW = "(max-width: 760px)";
const DENIED_MESSAGE = "You do not have access to that page.";

/** True under the breakpoint where portal.css turns the sidebar into a slide-in menu. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

/** "Ctrl K" or the command symbol, decided after mount so the server and first client render agree. */
function useShortcutHint(): string {
  const [hint, setHint] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setHint("\u2318K");
  }, []);
  return hint;
}

/** The customer on a deal page. The layout does not know it, so read the page's own heading once it renders. */
function useDealName(pathname: string): string | null {
  const [name, setName] = useState<string | null>(null);
  const onDeal = pathname.startsWith(`${ROUTES.partner.deals}/`) && pathname !== ROUTES.partner.newDeal;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the trigger
  useEffect(() => {
    setName(null);
    const main = document.getElementById("main");
    if (!onDeal || !main) return;
    const read = (): boolean => {
      const text = main.querySelector("h1")?.textContent?.trim();
      if (text) setName(text);
      return Boolean(text);
    };
    if (read()) return;
    const observer = new MutationObserver(() => {
      if (read()) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, onDeal]);
  return name;
}

export function Shell({
  kind,
  shell,
  nav,
  notifications,
  today,
  children,
}: {
  kind: PortalKind;
  /** The signed in viewer, their company and the nav counts, from getShell(). */
  shell: ShellDto;
  /** The viewer's own recent notifications, from listNotifications(). */
  notifications: NotificationsDto;
  /** The server's UTC date, so "Today" reads the same on every device. */
  today: string;
  /** The sidebar items this viewer may open, from navFor(). */
  nav: readonly NavItem[];
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const toast = useToast();
  const me = {
    org: shell.orgName,
    orgSub: shell.orgSub,
    orgInitials: initialsOf(shell.orgName),
    orgLogoUrl: shell.orgLogoUrl ?? null,
    user: shell.viewerName,
    userInitials: initialsOf(shell.viewerName),
    role: shell.roleLabel,
    manager: shell.manager ? { ...shell.manager, initials: initialsOf(shell.manager.name) } : undefined,
  };
  const waiting = shell.waitingApprovals;

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pop, setPop] = useState<"help" | "notes" | null>(null);
  const [msg, setMsg] = useState<{ subject: string; body: string; tried: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const msgBodyRef = useRef<HTMLTextAreaElement>(null);

  // close transient UI on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setPop(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPop(null);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A redirect from a page the role cannot open arrives as ?denied=1: say so once, then clean the address.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the trigger
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("denied") !== "1") return;
    toast(DENIED_MESSAGE);
    params.delete("denied");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
  }, [pathname]);

  const activeHref = activeNavHref(nav, pathname);
  const narrow = useNarrow();
  const dealName = useDealName(pathname);
  const shortcut = useShortcutHint();
  const nouns = searchNouns(kind, nav);
  const searchLabel = `Search ${joinWords(nouns.slice(0, 2)) || "pages"}`;
  const hasDocuments = nav.some((item) => item.href === ROUTES.partner.documents);

  // The crumb says only what the heading below does not: the organisation on mobile, the way back on a deal page.
  const underDeals = kind === "partner" && pathname.startsWith(`${ROUTES.partner.deals}/`);
  let crumb: React.JSX.Element;
  if (narrow) {
    crumb = (
      <nav aria-label="Breadcrumb" className="crumb">
        <b>{me.org}</b>
      </nav>
    );
  } else if (underDeals) {
    crumb = (
      <nav aria-label="Breadcrumb" className="crumb">
        <Link href={ROUTES.partner.deals}>Deals</Link>
        <span>/</span>
        <b aria-current="page">{pathname === ROUTES.partner.newDeal ? "Register deal" : (dealName ?? "Deal")}</b>
      </nav>
    );
  } else if (kind === "partner" && pathname.startsWith(ROUTES.partner.welcome)) {
    crumb = (
      <nav aria-label="Breadcrumb" className="crumb">
        <span>{me.org}</span>
        <span>/</span>
        <b>Overview</b>
      </nav>
    );
  } else if (kind === "partner") {
    crumb = (
      <nav aria-label="Breadcrumb" className="crumb">
        <b>{me.org}</b>
      </nav>
    );
  } else {
    crumb = <div className="crumb" />;
  }

  const sendMessage = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!msg || sending) return;
    if (!msg.body.trim()) {
      setMsg({ ...msg, tried: true });
      return;
    }
    setSending(true);
    try {
      const result = await sendManagerMessageAction({ subject: msg.subject, body: msg.body });
      if (!result.ok) {
        toast(result.error.issues?.[0]?.message ?? result.error.message);
        return;
      }
      setMsg(null);
      toast(`Message sent to ${result.data.managerName}`);
    } catch {
      toast("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const countFor = (item: NavItem): string => (item.count === "approvals" && waiting > 0 ? String(waiting) : "");

  const signOut = async (): Promise<void> => {
    const { error } = await settleAuth(() => authClient.signOut());
    if (error) {
      toast("Could not sign out. Check your connection and try again.");
      return;
    }
    // A full navigation, so no signed in page survives in the client router cache.
    window.location.assign(ROUTES.signIn);
  };

  return (
    <>
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <div className="app">
        <nav aria-label={kind === "partner" ? "Partner portal" : "Admin"} className={`side${menuOpen ? " side-open" : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="brand">
              <span className="logo">
                <img src="/logo-mark.svg" alt="CleanStart" style={{ width: 14, height: 16 }} />
              </span>
              <span className="brand-name">CleanStart</span>
              <span className="brand-tag">{kind === "partner" ? "Partners" : "Admin"}</span>
            </div>
            <div className="nav">
              {nav.map((item) => {
                const on = item.href === activeHref;
                const count = countFor(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-a${on ? " nav-on" : ""}`}
                    aria-current={on ? "page" : undefined}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                    {count ? (
                      <span className="nav-cnt" data-hint={`${count} ${waiting === 1 ? "deal" : "deals"} waiting for review`}>
                        {count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="side-foot">
            {kind === "partner" ? (
              <div className="who">
                <Avatar initials={me.orgInitials} logoUrl={me.orgLogoUrl} />
                <span className="who-t">
                  <span className="who-n">{me.org}</span>
                  <span className="who-s">{me.orgSub}</span>
                </span>
              </div>
            ) : null}
            <div className="profile">
              <button
                type="button"
                className="who-btn"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((o) => !o)}
              >
                <Avatar initials={me.userInitials} round me />
                <span className="who-t">
                  <span className="who-n">{me.user}</span>
                  <span className="who-s">{me.role}</span>
                </span>
                <Icon name="caret" className={`ic car${profileOpen ? " car-up" : ""}`} />
              </button>
              {profileOpen ? (
                <>
                  <Scrim className="dd-scrim" onClose={() => setProfileOpen(false)} />
                  <div className="pop pop-up" role="menu" aria-label="Profile">
                    <div className="pop-h" style={{ gap: 10, justifyContent: "flex-start" }}>
                      <Avatar initials={me.userInitials} round me />
                      <span className="who-t">
                        <span className="who-n" style={{ color: "#0F0E17" }}>
                          {me.user}
                        </span>
                        <span className="who-s" style={{ color: "#6B687D" }}>
                          {kind === "partner" ? `${me.role}, ${me.org}` : me.role}
                        </span>
                      </span>
                    </div>
                    <Link href={kind === "partner" ? ROUTES.partner.account : ROUTES.admin.account} role="menuitem" className="li">
                      <span className="li-ic">
                        <Icon name="team" />
                      </span>
                      <span className="li-t">
                        <span className="li-n">Your account</span>
                        <span className="li-s">Profile, password, two-step</span>
                      </span>
                    </Link>
                    {kind === "partner" && me.manager ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="li linkbtn"
                        style={{ width: "100%" }}
                        onClick={() => {
                          setProfileOpen(false);
                          setMsg({ subject: "Question about the portal", body: "", tried: false });
                        }}
                      >
                        <span className="li-ic">
                          <Icon name="send" />
                        </span>
                        <span className="li-t">
                          <span className="li-n">Message {me.manager.name}</span>
                          <span className="li-s">Your partner manager</span>
                        </span>
                      </button>
                    ) : null}
                    <button type="button" role="menuitem" className="li linkbtn" style={{ width: "100%" }} onClick={signOut}>
                      <span className="li-ic">
                        <Icon d={SIGN_OUT} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">Sign out</span>
                      </span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </nav>
        {menuOpen ? <Scrim className="cs-scrim" onClose={() => setMenuOpen(false)} style={{ zIndex: 40 }} /> : null}

        <div className="main">
          <header className="top">
            <button
              type="button"
              className="ibtn nav-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Icon d={MENU} />
            </button>
            {crumb}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                className="search"
                aria-haspopup="dialog"
                aria-label={searchLabel}
                onClick={() => {
                  setPop(null);
                  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                }}
              >
                <Icon name="search" small />
                <span className="search-t">{searchLabel}</span>
                <span className="kbd">{shortcut}</span>
              </button>
              <div className="pop-wrap">
                <button
                  type="button"
                  className="ibtn"
                  aria-label="Help"
                  aria-haspopup="dialog"
                  aria-expanded={pop === "help"}
                  onClick={() => setPop(pop === "help" ? null : "help")}
                >
                  <Icon d={HELP} />
                </button>
                {pop === "help" ? (
                  <>
                    <Scrim className="dd-scrim" onClose={() => setPop(null)} />
                    <div className="pop" role="dialog" aria-label="Help">
                      <div className="pop-h">
                        <h2 className="pop-t">Help</h2>
                      </div>
                      <button
                        type="button"
                        className="li linkbtn"
                        style={{ width: "100%" }}
                        onClick={() => {
                          setPop(null);
                          window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                        }}
                      >
                        <span className="li-ic">
                          <Icon name="search" />
                        </span>
                        <span className="li-t">
                          <span className="li-n">Search the portal</span>
                          <span className="li-s">
                            {capitalise(joinWords([...nouns, "pages"]))}
                          </span>
                        </span>
                        <span className="kbd">{shortcut}</span>
                      </button>
                      {kind === "partner" ? (
                        <>
                          {hasDocuments ? (
                            <Link href={ROUTES.partner.documents} className="li">
                              <span className="li-ic">
                                <Icon name="file" />
                              </span>
                              <span className="li-t">
                                <span className="li-n">Documents</span>
                                <span className="li-s">Guides and sales material</span>
                              </span>
                            </Link>
                          ) : null}
                          <Link href={ROUTES.partner.program} className="li" onClick={() => setPop(null)}>
                            <span className="li-ic">
                              <Icon name="info" />
                            </span>
                            <span className="li-t">
                              <span className="li-n">Program guide</span>
                              <span className="li-s">Deal protection, roles and support</span>
                            </span>
                          </Link>
                          {me.manager ? (
                            <button
                              type="button"
                              className="li linkbtn"
                              style={{ width: "100%" }}
                              onClick={() => {
                                setPop(null);
                                setMsg({ subject: "Question about the portal", body: "", tried: false });
                              }}
                            >
                              <span className="li-ic">
                                <Icon name="send" />
                              </span>
                              <span className="li-t">
                                <span className="li-n">Message your partner manager</span>
                                <span className="li-s">
                                  {me.manager.name}, {me.manager.team}
                                </span>
                              </span>
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <div className="li">
                          <span className="li-ic">
                            <Icon name="approve" />
                          </span>
                          <span className="li-t">
                            <span className="li-n">How approval works</span>
                            <span className="li-s" style={{ whiteSpace: "normal" }}>
                              Accepting creates the HubSpot deal, starts 90 days of protection and emails the partner.
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              <NotificationsPopover
                notifications={notifications}
                today={today}
                open={pop === "notes"}
                onToggle={() => setPop(pop === "notes" ? null : "notes")}
                onClose={() => setPop(null)}
                allHref={kind === "partner" ? ROUTES.partner.notifications : ROUTES.admin.notifications}
              />
            </div>
          </header>
          <main id="main" className="content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <SearchPalette kind={kind} nav={nav} />

      {kind === "partner" && me.manager ? (
        <Drawer
          open={msg !== null}
          onClose={() => setMsg(null)}
          title={`Message ${me.manager.name}`}
          subtitle={`Your CleanStart partner manager, ${me.manager.team.replace("CleanStart ", "")}. Replies come to your email.`}
          lead={<span className="av av-2">{me.manager.initials}</span>}
          onSubmit={sendMessage}
          initialFocus={msgBodyRef}
          footer={
            <>
              <span className="hint">Sent from {shell.viewerEmail}</span>
              <button type="button" className="btn btn-s" onClick={() => setMsg(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-p" disabled={sending}>
                <Icon name="send" />
                Send
              </button>
            </>
          }
        >
          <div className="fg">
            <label htmlFor="msg-s" className="lbl">
              Subject
            </label>
            <input
              id="msg-s"
              className="field"
              type="text"
              value={msg?.subject ?? ""}
              onChange={(e) => msg && setMsg({ ...msg, subject: e.target.value })}
            />
          </div>
          <div className="fg">
            <label htmlFor="msg-b" className="lbl">
              Message
            </label>
            <textarea
              id="msg-b"
              ref={msgBodyRef}
              className={`field${msg?.tried && !msg.body.trim() ? " field-err" : ""}`}
              rows={8}
              value={msg?.body ?? ""}
              onChange={(e) => msg && setMsg({ ...msg, body: e.target.value })}
              aria-invalid={msg?.tried && !msg.body.trim() ? true : undefined}
            />
            {msg?.tried && !msg.body.trim() ? <span className="err">Write a message first.</span> : null}
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const SIGN_OUT =
  "M118,216a6,6,0,0,1-6,6H48a6,6,0,0,1-6-6V40a6,6,0,0,1,6-6h64a6,6,0,0,1,0,12H54V210h58A6,6,0,0,1,118,216Zm110.24-92.24-40-40a6,6,0,0,0-8.48,8.48L209.51,122H112a6,6,0,0,0,0,12h97.51l-29.75,29.76a6,6,0,1,0,8.48,8.48l40-40A6,6,0,0,0,228.24,123.76Z";
const MENU =
  "M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128ZM40,70H216a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12ZM216,186H40a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12Z";
const HELP =
  "M138,180a10,10,0,1,1-10-10A10,10,0,0,1,138,180ZM128,74c-21,0-38,15.25-38,34v4a6,6,0,0,0,12,0v-4c0-12.13,11.66-22,26-22s26,9.87,26,22-11.66,22-26,22a6,6,0,0,0-6,6v8a6,6,0,0,0,12,0v-2.42c18.11-2.58,32-16.66,32-33.58C166,89.25,149,74,128,74Zm102,54A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z";
