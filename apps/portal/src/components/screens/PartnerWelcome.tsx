"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageDrawer } from "@/components/partners/message-drawer";
import { fmtShort } from "@/lib/dates";
import { DOCUMENT_TYPE_LABEL } from "@/lib/domain";
import type { ChecklistDto, CompanyDto, DocumentListItemDto } from "@/lib/dto";
import { formatAgreement } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { tickChecklistStepAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";

interface Step {
  key: string;
  title: string;
  text: string;
  /** A route, or "message" to open the partner-manager drawer. Null when there is nothing to do. */
  target: string | null;
  action: string;
  icon: IconName;
}

const buildSteps = (company: CompanyDto): readonly Step[] => [
  {
    key: "agreement",
    title: "Accept the partner agreement",
    text: company.agreementAcceptedAt ? `${formatAgreement(company.agreementVersion, company.agreementAcceptedAt)}.` : "Not accepted yet.",
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
    text: company.manager
      ? `A 30-minute call with ${company.manager.name}, your partner manager.`
      : "A 30-minute call with your partner manager.",
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
    text: `${company.name} shows as onboarding until this is done.`,
    target: ROUTES.partner.newDeal,
    action: "Register",
    icon: "reg",
  },
];

// The row's `.li .btn` rule shrinks buttons to 18px, so the standard size is set here.
const ACTION_STYLE = { marginLeft: "auto", height: 30, padding: "0 10px", fontSize: 13 } as const;

interface PartnerWelcomeProps {
  firstName: string;
  company: CompanyDto;
  checklist: ChecklistDto;
  viewerEmail: string;
  /** The newest documents this partner can open. Empty until CleanStart publishes some. */
  starters: DocumentListItemDto[];
}

export function PartnerWelcome({ firstName, company, checklist, viewerEmail, starters }: PartnerWelcomeProps): React.JSX.Element {
  const STEPS = buildSteps(company);
  const done: Record<string, boolean> = Object.fromEntries(checklist.steps.map((s) => [s.step, s.done]));
  const [messaging, setMessaging] = useState(false);
  const doneCount = STEPS.filter((s) => done[s.key]).length;
  const percent = checklist.percent;
  const tick = (step: "kickoff"): void => void tickChecklistStepAction({ step });

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Welcome, {firstName}</h1>
          <span className="h1-sub">
            {company.name} joined the CleanStart partner program on {fmtShort(company.since)}.
          </span>
        </div>
        <Link href={ROUTES.partner.newDeal} className="btn btn-p">
          <Icon name="reg" />
          Register deal
        </Link>
      </div>

      <section aria-labelledby="setup" className="card clip">
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 id="setup" className="card-t">
              Get set up
            </h2>
            <span className="card-meta tnum">
              {doneCount} of {STEPS.length} done
            </span>
          </div>
          {/* biome-ignore lint/a11y/useFocusableInteractive: a read-only progress display, not an interactive widget */}
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
              {!isDone && step.target === "message" && company.manager ? (
                <button
                  type="button"
                  className="btn btn-s"
                  style={ACTION_STYLE}
                  onClick={() => {
                    setMessaging(true);
                    tick("kickoff");
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
        {done.deal ? null : (
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
                Register a customer you are working with. Once CleanStart accepts it, nobody else can claim it for 90 days.
              </span>
              <Link href={ROUTES.partner.newDeal} className="btn btn-p" style={{ marginTop: 4 }}>
                Register your first deal
              </Link>
            </div>
          </section>
        )}
        {done.team ? null : (
          <section aria-labelledby="myteam" className="card clip" style={{ flex: "1 1 300px", minWidth: 0 }}>
            <div className="card-h">
              <h2 id="myteam" className="card-t">
                Your team
              </h2>
              <span className="card-meta">Just you</span>
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
                Sales and technical colleagues get their own login. Their deals stay with {company.name} if they leave.
              </span>
              <Link href={ROUTES.partner.team} className="btn btn-s" style={{ marginTop: 4 }}>
                Invite colleagues
              </Link>
            </div>
          </section>
        )}
        <section aria-labelledby="start" className="card clip" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div className="card-h">
            <h2 id="start" className="card-t">
              Start here
            </h2>
            <Link href={ROUTES.partner.documents} className="link-sm">
              All documents
            </Link>
          </div>
          {starters.length === 0 ? (
            <Link href={ROUTES.partner.documents} className="li">
              <span className="li-ic">
                <Icon name="docs" />
              </span>
              <span className="li-t">
                <span className="li-n">Open the document library</span>
                <span className="li-s">Datasheets, videos and playbooks for your products.</span>
              </span>
            </Link>
          ) : (
            starters.map((d) => (
              <Link href={`${ROUTES.partner.documents}?doc=${d.id}`} className="li" key={d.id}>
                <span className="li-ic">
                  <Icon name={d.type === "video" ? "play" : "file"} />
                </span>
                <span className="li-t">
                  <span className="li-n">{d.title}</span>
                  <span className="li-s">
                    {DOCUMENT_TYPE_LABEL[d.type]}
                    {d.durationMinutes ? `, ${d.durationMinutes} min` : ""}
                  </span>
                </span>
              </Link>
            ))
          )}
        </section>
      </div>

      {messaging && company.manager ? (
        <MessageDrawer
          open
          onClose={() => setMessaging(false)}
          manager={company.manager.name}
          team={company.manager.team.replace("CleanStart ", "")}
          subject={`Kickoff call for ${company.name}`}
          from={viewerEmail}
        />
      ) : null}
    </div>
  );
}
