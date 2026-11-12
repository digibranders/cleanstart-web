"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useWaitingApprovals } from "@/data/deals";
import { createSlice } from "@/lib/slice";
import { ADMIN_NAV, type NavItem, PARTNER_NAV, type PortalKind, ROUTES } from "@/lib/routes";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
import { Avatar } from "../ui/badge";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { KESTREL, type Persona, QAMAR, STAFF } from "./personas";

interface SearchEntry {
  label: string;
  href: string;
  icon: IconName;
  hint: string;
}

interface Note {
  title: string;
  when: string;
  href: string;
  icon: IconName;
  unread: boolean;
}

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");

const PARTNER_SEARCH: Record<string, SearchEntry[]> = {
  Pages: [
    { label: "Overview", href: ROUTES.partner.overview, icon: "dash", hint: "" },
    { label: "Deals", href: ROUTES.partner.deals, icon: "deals", hint: "" },
    { label: "Register a deal", href: ROUTES.partner.newDeal, icon: "reg", hint: "" },
    { label: "Documents", href: ROUTES.partner.documents, icon: "docs", hint: "" },
    { label: "Team", href: ROUTES.partner.team, icon: "team", hint: "" },
    { label: "Company and tier", href: ROUTES.partner.company, icon: "bld", hint: "" },
    { label: "Your account", href: ROUTES.partner.account, icon: "team", hint: "" },
  ],
  Deals: [
    ["Vardhan Capital", "CleanSight, accepted"],
    ["Gulfway Freight", "CleanStart Images, pending"],
    ["Tejas Health Network", "CleanSight, accepted"],
    ["Al Noor Logistics", "Clean Libraries, accepted"],
    ["Indus Paytech", "CleanStart Images, won"],
    ["Saffron Retail Group", "CleanStart Images, rejected"],
  ].map(([label = "", hint = ""]) => ({
    label: label as string,
    href: ROUTES.partner.deal(slug(label as string)),
    icon: "deals" as const,
    hint: hint as string,
  })),
  Documents: [
    ["CleanSight product walkthrough", "Video", "play"],
    ["Clean Libraries solution sheet", "Solution sheet", "file"],
    ["Partner sales playbook 2026", "Enablement guide", "file"],
    ["Competitive battlecard", "Battlecard", "file"],
  ].map(([label, hint, icon]) => ({
    label: label as string,
    href: ROUTES.partner.documents,
    icon: icon as IconName,
    hint: hint as string,
  })),
};

const ADMIN_SEARCH: Record<string, SearchEntry[]> = {
  Pages: [
    { label: "Deal approvals", href: ROUTES.admin.approvals, icon: "approve", hint: "" },
    { label: "Partners", href: ROUTES.admin.partners, icon: "bld", hint: "" },
    { label: "Documents", href: ROUTES.admin.documents, icon: "docs", hint: "" },
    { label: "Reports", href: ROUTES.admin.reports, icon: "chart", hint: "" },
    { label: "CleanStart team", href: ROUTES.admin.team, icon: "team", hint: "" },
    { label: "Audit log", href: ROUTES.admin.audit, icon: "clk", hint: "" },
  ],
  "Waiting for approval": [
    ["Gulfway Freight", "Kestrel Systems, conflict"],
    ["Vardhan Capital", "Kestrel Systems"],
    ["Gulfway Freight", "Arbor Cyber, conflict"],
    ["Meridian Insurance", "Saffron Secure"],
  ].map(([label = "", hint = ""]) => ({
    label,
    href: ROUTES.admin.approvals,
    icon: "approve" as const,
    hint,
  })),
  Partners: [
    ["Kestrel Systems", "India"],
    ["Saffron Secure", "India"],
    ["Arbor Cyber", "Middle East"],
    ["Dunes Networks", "Middle East"],
    ["Harbourline IT", "Middle East"],
    ["Vyom Digital", "India"],
    ["Coralbay Technologies", "Middle East"],
    ["Meghdoot Systems", "India"],
    ["Qamar Solutions", "Middle East"],
    ["Ironleaf Consulting", "India"],
  ].map(([label = "", hint = ""]) => ({
    label,
    href: ROUTES.admin.partners,
    icon: "bld" as const,
    hint,
  })),
};

const partnerNotes = (): [string, string, string, IconName, boolean][] => [
  ["Rohit Desai asked for a login", "Today", ROUTES.partner.team, "team", true],
  ["Gulfway Freight is waiting for review", "3 days ago", ROUTES.partner.deals, "clk", true],
  ["New document: CleanSight product walkthrough", "4 Nov", ROUTES.partner.documents, "play", true],
  ["Vardhan Capital moved to Proposal sent", "28 Oct", ROUTES.partner.deal("vardhan-capital"), "deals", false],
];
const adminNotes = (): [string, string, string, IconName, boolean][] => [
  ["Arbor Cyber registered Gulfway Freight, a conflict", "1 day ago", ROUTES.admin.approvals, "warn", true],
  ["Lattice Cloud Services applied to be a partner", "1 day ago", ROUTES.admin.partners, "bld", true],
  ["5 protected deals end in the next 14 days", "6 Nov", ROUTES.admin.reports, "hg", false],
];

const notesRead = createSlice<{ partner: boolean; admin: boolean }>("notes-read", {
  partner: false,
  admin: false,
});

function personaFor(kind: PortalKind, pathname: string): Persona {
  if (kind === "admin") return STAFF;
  return pathname.startsWith(ROUTES.partner.welcome) ? QAMAR : KESTREL;
}

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
  children,
}: {
  kind: PortalKind;
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const toast = useToast();
  const persona = personaFor(kind, pathname);
  const nav = kind === "partner" ? PARTNER_NAV : ADMIN_NAV;
  const waiting = useWaitingApprovals();
  const read = notesRead.use()[kind];

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pop, setPop] = useState<"help" | "notes" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState<{ subject: string; body: string; tried: boolean } | null>(null);

  // close transient UI on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setPop(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setQuery("");
        setPop(null);
      } else if (event.key === "Escape") {
        setPop(null);
        setProfileOpen(false);
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searchData = kind === "partner" ? PARTNER_SEARCH : ADMIN_SEARCH;
  const q = query.trim().toLowerCase();
  const groups = Object.entries(searchData)
    .map(([name, items]) => ({
      name,
      items: items
        .filter((i) => !q || `${i.label} ${i.hint}`.toLowerCase().includes(q))
        .slice(0, q ? 8 : name === "Pages" ? 8 : 3),
    }))
    .filter((g) => g.items.length > 0);

  const notes: Note[] = (kind === "partner" ? partnerNotes() : adminNotes()).map(
    ([title, when, href, icon, unread]) => ({ title, when, href, icon, unread: unread && !read }),
  );
  const unreadCount = notes.filter((n) => n.unread).length;
  const crumb = crumbFor(nav, pathname);

  const sendMessage = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!msg) return;
    if (!msg.body.trim()) {
      setMsg({ ...msg, tried: true });
      return;
    }
    setMsg(null);
    toast(`Message sent to ${persona.manager?.name ?? "your partner manager"}`);
  };

  const countFor = (item: NavItem): string => (item.count === "approvals" && waiting > 0 ? String(waiting) : "");

  return (
    <>
      <div className="mock-banner">
        Clickable mock for review. All names and numbers are made up and nothing is sent.
      </div>
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
                    data-tour={`nav-${slug(item.label)}`}
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
                <Avatar initials={persona.orgInitials} />
                <span className="who-t">
                  <span className="who-n">{persona.org}</span>
                  <span className="who-s">{persona.orgSub}</span>
                </span>
              </div>
            ) : null}
            <div className="profile">
              <button
                type="button"
                className="who-btn"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                data-tour="profile-menu"
                onClick={() => setProfileOpen((o) => !o)}
              >
                <Avatar initials={persona.userInitials} round me />
                <span className="who-t">
                  <span className="who-n">{persona.user}</span>
                  <span className="who-s">{persona.role}</span>
                </span>
                <Icon name="caret" className={`ic car${profileOpen ? " car-up" : ""}`} />
              </button>
              {profileOpen ? (
                <>
                  <div className="dd-scrim" onClick={() => setProfileOpen(false)} aria-hidden="true" />
                  <div className="pop pop-up" role="menu" aria-label="Profile">
                    <div className="pop-h" style={{ gap: 10, justifyContent: "flex-start" }}>
                      <Avatar initials={persona.userInitials} round me />
                      <span className="who-t">
                        <span className="who-n" style={{ color: "#0F0E17" }}>
                          {persona.user}
                        </span>
                        <span className="who-s" style={{ color: "#6B687D" }}>
                          {kind === "partner" ? `${persona.role}, ${persona.org}` : persona.role}
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
                            <span className="li-n">Message {persona.manager?.name}</span>
                            <span className="li-s">Your partner manager</span>
                          </span>
                        </button>
                      </>
                    ) : null}
                    <Link
                      href={kind === "partner" ? ROUTES.admin.approvals : ROUTES.partner.overview}
                      role="menuitem"
                      className="li"
                    >
                      <span className="li-ic">
                        <Icon name={kind === "partner" ? "approve" : "deals"} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">{kind === "partner" ? "View as CleanStart staff" : "View as a partner"}</span>
                        <span className="li-s">Review mode, switch role</span>
                      </span>
                    </Link>
                    <Link href={ROUTES.signIn} role="menuitem" className="li">
                      <span className="li-ic">
                        <Icon d={SIGN_OUT} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">Sign out</span>
                      </span>
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </nav>
        {menuOpen ? <div className="cs-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" style={{ zIndex: 40 }} /> : null}

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
              <span>{persona.org}</span>
              <span>/</span>
              <b>{crumb}</b>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                className="search"
                aria-haspopup="dialog"
                data-tour="search"
                onClick={() => {
                  setSearchOpen(true);
                  setQuery("");
                  setPop(null);
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
                    <div className="dd-scrim" onClick={() => setPop(null)} aria-hidden="true" />
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
                          setSearchOpen(true);
                          setQuery("");
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
                                {persona.manager?.name}, {persona.manager?.team}
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
              <div className="pop-wrap">
                <button
                  type="button"
                  className="ibtn"
                  aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
                  aria-haspopup="dialog"
                  aria-expanded={pop === "notes"}
                  onClick={() => setPop(pop === "notes" ? null : "notes")}
                >
                  <Icon d={BELL} />
                  {unreadCount ? <span className="ping" aria-hidden="true" /> : null}
                </button>
                {pop === "notes" ? (
                  <>
                    <div className="dd-scrim" onClick={() => setPop(null)} aria-hidden="true" />
                    <div className="pop" role="dialog" aria-label="Notifications">
                      <div className="pop-h">
                        <h2 className="pop-t">Notifications</h2>
                        {unreadCount ? (
                          <button
                            type="button"
                            className="btn btn-t"
                            onClick={() => notesRead.set((s) => ({ ...s, [kind]: true }))}
                          >
                            Mark all read
                          </button>
                        ) : null}
                      </div>
                      {notes.map((n) => (
                        <Link key={n.title} href={n.href} className="li" style={{ alignItems: "flex-start" }}>
                          <span className="li-ic">
                            <Icon name={n.icon} />
                          </span>
                          <span className="li-t">
                            <span className="li-n" style={{ whiteSpace: "normal" }}>
                              {n.title}
                            </span>
                            <span className="li-s">{n.when}</span>
                          </span>
                          {n.unread ? <span className="unread" role="img" aria-label="Unread" /> : null}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </header>
          <main className="content">{children}</main>
        </div>
      </div>

      {searchOpen ? (
        <>
          <div className="cs-scrim" onClick={() => setSearchOpen(false)} aria-hidden="true" />
          <div className="dialog palette" role="dialog" aria-modal="true" aria-label="Search">
            <div className="pal-in">
              <Icon name="search" />
              <label className="sr" htmlFor="pal-q">
                Search
              </label>
              <input
                id="pal-q"
                type="search"
                placeholder={kind === "partner" ? "Search deals, documents and pages" : "Search partners, registrations and pages"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                // biome-ignore lint/a11y/noAutofocus: the palette exists to be typed into
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                className="ibtn"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                style={{ width: 26, height: 26 }}
              >
                <Icon name="x" />
              </button>
            </div>
            <div className="pal-list">
              {groups.map((g) => (
                <div key={g.name}>
                  <div className="pal-g">{g.name}</div>
                  {g.items.map((it) => (
                    <Link
                      key={`${it.label}-${it.hint}`}
                      href={it.href}
                      className="pal-item"
                      onClick={() => setSearchOpen(false)}
                    >
                      <span className="li-ic">
                        <Icon name={it.icon} />
                      </span>
                      <span>{it.label}</span>
                      <span className="li-s">{it.hint}</span>
                    </Link>
                  ))}
                </div>
              ))}
              {groups.length === 0 ? <div className="empty">Nothing matches {query}.</div> : null}
            </div>
          </div>
        </>
      ) : null}

      {kind === "partner" && persona.manager ? (
        <Drawer
          open={msg !== null}
          onClose={() => setMsg(null)}
          title={`Message ${persona.manager.name}`}
          subtitle={`Your CleanStart partner manager, ${persona.manager.team.replace("CleanStart ", "")}. Replies come to your email.`}
          lead={<span className="av av-2">{persona.manager.initials}</span>}
          onSubmit={sendMessage}
          footer={
            <>
              <span className="hint">Sent from {persona.user.toLowerCase().replace(" ", ".")}@{persona.org.toLowerCase().replace(/\s+/g, "")}.com</span>
              <button type="button" className="btn btn-s" onClick={() => setMsg(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-p">
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
const BELL =
  "M220.07,176.94C214.41,167.2,206,139.73,206,104a78,78,0,1,0-156,0c0,35.74-8.42,63.2-14.08,72.94A14,14,0,0,0,48,198H90.48a38,38,0,0,0,75,0H208a14,14,0,0,0,12.06-21.06ZM128,218a26,26,0,0,1-25.29-20h50.58A26,26,0,0,1,128,218Zm81.71-33a1.9,1.9,0,0,1-1.7,1H48a1.9,1.9,0,0,1-1.7-1,2,2,0,0,1,0-2C53.87,170,62,139.69,62,104a66,66,0,1,1,132,0c0,35.68,8.14,65.95,15.71,79A2,2,0,0,1,209.71,185Z";
