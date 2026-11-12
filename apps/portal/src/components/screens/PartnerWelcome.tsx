"use client";

import Link from "next/link";
import { useState } from "react";
import { welcomeSlice } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
import { QAMAR } from "../shell/personas";

interface Step {
  key: string;
  title: string;
  text: string;
  /** A route, or "message" to open the partner-manager drawer. Null when there is nothing to do. */
  target: string | null;
  action: string;
  icon: IconName;
}

const STEPS: readonly Step[] = [
  {
    key: "agreement",
    title: "Accept the partner agreement",
    text: "Version 1.2, accepted today.",
    target: null,
    action: "",
    icon: "file",
  },
  {
    key: "company",
    title: "Add your company details",
    text: "Address, website and what you sell. Your partner manager reads this first.",
    target: ROUTES.partner.company,
    action: "Add details",
    icon: "bld",
  },
  {
    key: "team",
    title: "Invite your colleagues",
    text: "Give your sales and technical people their own login.",
    target: ROUTES.partner.team,
    action: "Invite",
    icon: "team",
  },
  {
    key: "kickoff",
    title: "Book your kickoff call",
    text: "A 30-minute call with Omar Nasser, your partner manager.",
    target: "message",
    action: "Book a call",
    icon: "clk",
  },
  {
    key: "playbook",
    title: "Read the partner sales playbook",
    text: "Ideal customers, discovery and how deal registration works.",
    target: ROUTES.partner.documents,
    action: "Open",
    icon: "docs",
  },
  {
    key: "deal",
    title: "Register your first deal",
    text: "Qamar Solutions shows as onboarding until this is done.",
    target: ROUTES.partner.newDeal,
    action: "Register",
    icon: "reg",
  },
];

const STARTERS: { title: string; meta: string; icon: IconName }[] = [
  { title: "Partner sales playbook 2026", meta: "Enablement guide, PDF", icon: "docs" },
  { title: "CleanSight product walkthrough", meta: "Video, 14 min", icon: "play" },
  { title: "Competitive battlecard", meta: "Battlecard, PDF", icon: "file" },
];

const ACTION_STYLE = { marginLeft: "auto", height: 28 } as const;

export function PartnerWelcome(): React.JSX.Element {
  const done = welcomeSlice.use();
  const [messaging, setMessaging] = useState(false);
  const doneCount = STEPS.filter((s) => done[s.key]).length;
  const percent = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Welcome, Yasmin</h1>
          <span className="h1-sub">Qamar Solutions joined the CleanStart partner program on 27 Oct.</span>
        </div>
        <Link href={ROUTES.partner.newDeal} className="btn btn-p">
          <Icon name="reg" />
          Register a deal
        </Link>
      </div>

      <section aria-labelledby="setup" className="card clip" data-tour="welcome-checklist">
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 id="setup" className="card-t">
              Get set up
            </h2>
            <span className="card-meta tnum">
              {doneCount} of {STEPS.length} done
            </span>
          </div>
          <span
            className="bar"
            style={{ width: 180 }}
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={STEPS.length}
            aria-valuenow={doneCount}
          >
            <span style={{ width: `${percent}%` }} />
          </span>
        </div>
        {STEPS.map((step) => {
          const isDone = Boolean(done[step.key]);
          return (
            <div className="li" style={{ padding: "10px 12px" }} key={step.key}>
              <span className={`li-ic${isDone ? " tone-green" : ""}`}>
                <Icon name={isDone ? "check" : step.icon} />
              </span>
              <span className="li-t">
                <span
                  className="li-n"
                  style={isDone ? { color: "#6B687D", textDecoration: "line-through" } : undefined}
                >
                  {step.title}
                  <span className="sr">{isDone ? ", done" : ", to do"}</span>
                </span>
                <span className="li-s" style={{ whiteSpace: "normal" }}>
                  {step.text}
                </span>
              </span>
              {!isDone && step.target && step.target !== "message" ? (
                <Link href={step.target} className="btn btn-s" style={ACTION_STYLE}>
                  {step.action}
                </Link>
              ) : null}
              {!isDone && step.target === "message" ? (
                <button
                  type="button"
                  className="btn btn-s"
                  style={ACTION_STYLE}
                  onClick={() => {
                    setMessaging(true);
                    welcomeSlice.set((prev) => ({ ...prev, [step.key]: true }));
                  }}
                >
                  {step.action}
                </button>
              ) : null}
              {isDone ? (
                <span className="badge b-accepted" style={{ marginLeft: "auto" }}>
                  Done
                </span>
              ) : null}
            </div>
          );
        })}
      </section>

      <div className="row">
        <section aria-labelledby="mydeals" className="card clip" style={{ flex: "1 1 420px", minWidth: 0 }}>
          <div className="card-h">
            <h2 id="mydeals" className="card-t">
              Your deals
            </h2>
          </div>
          <div
            className="card-b"
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "24px 16px" }}
          >
            <span className="li-ic tone-violet" style={{ width: 32, height: 32 }}>
              <Icon name="deals" />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>No deals yet</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E", maxWidth: "46ch" }}>
              Register a customer you are working with. Once CleanStart accepts it, nobody else can claim it for 90
              days.
            </span>
            <Link href={ROUTES.partner.newDeal} className="btn btn-p" style={{ marginTop: 4 }}>
              Register your first deal
            </Link>
          </div>
        </section>
        <section aria-labelledby="myteam" className="card clip" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div className="card-h">
            <h2 id="myteam" className="card-t">
              Your team
            </h2>
            <span className="card-meta">1 person</span>
          </div>
          <div
            className="card-b"
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "24px 16px" }}
          >
            <span className="li-ic" style={{ width: 32, height: 32 }}>
              <Icon name="team" />
            </span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Only you so far</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
              Sales and technical colleagues get their own login. Their deals stay with Qamar Solutions if they leave.
            </span>
            <Link href={ROUTES.partner.team} className="btn btn-s" style={{ marginTop: 4 }}>
              Invite colleagues
            </Link>
          </div>
        </section>
        <section aria-labelledby="start" className="card clip" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div className="card-h">
            <h2 id="start" className="card-t">
              Start here
            </h2>
            <Link href={ROUTES.partner.documents} className="link-sm">
              All documents
            </Link>
          </div>
          {STARTERS.map((d) => (
            <Link href={ROUTES.partner.documents} className="li" key={d.title}>
              <span className="li-ic">
                <Icon name={d.icon} />
              </span>
              <span className="li-t">
                <span className="li-n">{d.title}</span>
                <span className="li-s">{d.meta}</span>
              </span>
            </Link>
          ))}
        </section>
      </div>

      {messaging ? (
        <ManagerMessageDrawer
          persona={QAMAR}
          initialSubject="Kickoff call for Qamar Solutions"
          onClose={() => setMessaging(false)}
        />
      ) : null}
    </div>
  );
}
