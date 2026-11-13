"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { settleAuth } from "@/lib/auth-call";
import { authClient } from "@/lib/auth-client";
import type { NotificationsDto, ShellDto } from "@/lib/dto";
import { initialsOf } from "@/lib/initials";
import { type NavItem, type PortalKind, ROUTES } from "@/lib/routes";
import { sendManagerMessageAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import { Avatar } from "../ui/badge";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { NotificationsPopover } from "./notifications-popover";
import { OPEN_SEARCH_EVENT, SearchPalette } from "./search-palette";
import { Scrim } from "@/components/ui/scrim";

function crumbFor(nav: readonly NavItem[], pathname: string): string {
  if (pathname.startsWith(ROUTES.partner.account)) return "Your account";
  if (pathname.startsWith(ROUTES.partner.welcome)) return "Overview";
  const match = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return match?.label ?? "";
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

  const crumb = crumbFor(nav, pathname);

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
                const on = pathname === item.href || pathname.startsWith(`${item.href}/`) ||
                  (item.href === ROUTES.partner.overview && pathname.startsWith(ROUTES.partner.welcome));
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
                    {count ? <span className="nav-cnt">{count}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="side-foot">
            {kind === "partner" ? (
              <div className="who">
                <Avatar initials={me.orgInitials} />
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
                    {kind === "partner" ? (
                      <>
                        <Link href={ROUTES.partner.account} role="menuitem" className="li">
                          <span className="li-ic">
                            <Icon name="team" />
                          </span>
                          <span className="li-t">
                            <span className="li-n">Your account</span>
                            <span className="li-s">Profile, password, two-step</span>
                          </span>
                        </Link>
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
                            <span className="li-n">Message {me.manager?.name}</span>
                            <span className="li-s">Your partner manager</span>
                          </span>
                        </button>
                      </>
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
            <nav aria-label="Breadcrumb" className="crumb">
              <span>{me.org}</span>
              <span>/</span>
              <b>{crumb}</b>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                className="search"
                aria-haspopup="dialog"
                aria-label={kind === "partner" ? "Search deals and documents" : "Search partners and registrations"}
                onClick={() => {
                  setPop(null);
                  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                }}
              >
                <Icon name="search" small />
                <span className="search-t">
                  {kind === "partner" ? "Search deals and documents" : "Search partners and registrations"}
                </span>
                <span className="kbd">Ctrl K</span>
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
                            {kind === "partner" ? "Deals, documents and pages" : "Partners, registrations and pages"}
                          </span>
                        </span>
                        <span className="kbd">Ctrl K</span>
                      </button>
                      {kind === "partner" ? (
                        <>
                          <Link href={ROUTES.partner.documents} className="li">
                            <span className="li-ic">
                              <Icon name="file" />
                            </span>
                            <span className="li-t">
                              <span className="li-n">Partner sales playbook 2026</span>
                              <span className="li-s">How deal registration and protection work</span>
                            </span>
                          </Link>
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
                                {me.manager?.name}, {me.manager?.team}
                              </span>
                            </span>
                          </button>
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

const SIGN_OUT =
  "M118,216a6,6,0,0,1-6,6H48a6,6,0,0,1-6-6V40a6,6,0,0,1,6-6h64a6,6,0,0,1,0,12H54V210h58A6,6,0,0,1,118,216Zm110.24-92.24-40-40a6,6,0,0,0-8.48,8.48L209.51,122H112a6,6,0,0,0,0,12h97.51l-29.75,29.76a6,6,0,1,0,8.48,8.48l40-40A6,6,0,0,0,228.24,123.76Z";
const MENU =
  "M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128ZM40,70H216a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12ZM216,186H40a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12Z";
const HELP =
  "M138,180a10,10,0,1,1-10-10A10,10,0,0,1,138,180ZM128,74c-21,0-38,15.25-38,34v4a6,6,0,0,0,12,0v-4c0-12.13,11.66-22,26-22s26,9.87,26,22-11.66,22-26,22a6,6,0,0,0-6,6v8a6,6,0,0,0,12,0v-2.42c18.11-2.58,32-16.66,32-33.58C166,89.25,149,74,128,74Zm102,54A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z";
