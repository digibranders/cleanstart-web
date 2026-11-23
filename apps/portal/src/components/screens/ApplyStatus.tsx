"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { type ApplicationStatusDto, type StatusStepState, statusSteps } from "@/lib/application-status";
import { fmtLong } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";

const DOT_D =
  "M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Z";
const STOP_D =
  "M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z";

const STATE_LABEL: Record<StatusStepState, string> = {
  done: ", done",
  now: ", current step",
  next: ", not reached yet",
  stopped: ", ended here",
};
const DOT_STYLE: Record<StatusStepState, React.CSSProperties> = {
  done: { background: "#E9F7EF", color: "#17663A" },
  now: { background: "#4B23C8", color: "#FFFFFF" },
  next: { background: "#F1F0F4", color: "#8D87A8" },
  stopped: { background: "#FDECEC", color: "#A3262A" },
};

const ASIDE = (
  <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
      Your application
    </h2>
    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#6B687D" }}>
      This page is private to you. Bookmark the link from your confirmation email to come back to it.
    </p>
  </div>
);

/** The private status page. No sign-in; the link in the email is the key. A wrong or old link gets a calm message and nothing else. */
export function ApplyStatus({ status }: { status: ApplicationStatusDto }): React.JSX.Element {
  if (status.state !== "ok") {
    const expired = status.state === "expired";
    return (
      <PublicSplit label="Application status" tag="Partner program" footerLeft="CleanStart Partner Program" asideLabel="About this page" aside={ASIDE}>
        <div role="status" style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <PublicHeading title={expired ? "This status link has expired" : "We could not find that application"}>
            {expired
              ? "Status links work for 30 days. Reply to your confirmation email and the partner team will tell you where things stand."
              : "Check that you opened the whole link from your confirmation email. If it still fails, reply to that email and the partner team will help."}
          </PublicHeading>
          <Link href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
            Go to sign in
          </Link>
        </div>
      </PublicSplit>
    );
  }

  const steps = statusSteps(status);
  const decided = status.status === "approved" || status.status === "declined";
  return (
    <PublicSplit label="Application status" tag="Partner program" footerLeft="CleanStart Partner Program" asideLabel="About this page" aside={ASIDE}>
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {status.status === "declined" ? <StatusIcon d={STOP_D} /> : <StatusIcon d={CHECK_D} tone="green" />}
        <PublicHeading title={`${status.company}: ${decided ? (status.status === "approved" ? "approved" : "not approved") : "in review"}`}>
          Reference {status.reference}, received {fmtLong(status.submittedOn)}.
        </PublicHeading>
        <ol aria-label="Application progress" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
          {steps.map((step) => (
            <li key={step.key} style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 12, paddingBottom: 14 }} aria-current={step.state === "now" ? "step" : undefined}>
              <span style={{ width: 22, height: 22, borderRadius: 99, display: "grid", placeItems: "center", ...DOT_STYLE[step.state] }}>
                <Icon d={step.state === "done" ? CHECK_D : step.state === "stopped" ? STOP_D : DOT_D} small />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13.5, fontWeight: step.state === "now" ? 700 : 600 }}>
                  {step.title}
                  <span className="sr">{STATE_LABEL[step.state]}</span>
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#6B687D" }}>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p style={{ margin: 0, fontSize: 12.5, color: "#6B687D" }}>
          Questions? Reply to the confirmation email and it reaches the partner team.
        </p>
      </div>
    </PublicSplit>
  );
}
