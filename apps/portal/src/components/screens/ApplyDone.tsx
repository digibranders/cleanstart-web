"use client";

import { Icon } from "@/components/icon";
import { BulletList, CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { partnersSlice } from "@/data/partners";

const DOT_D =
  "M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Z";

type StepState = "done" | "now" | "next";

const STATE_LABEL: Record<StepState, string> = { done: ", done", now: ", in progress", next: ", not started" };
const DOT_STYLE: Record<StepState, React.CSSProperties> = {
  done: { background: "#E9F7EF", color: "#17663A" },
  now: { background: "#4B23C8", color: "#FFFFFF" },
  next: { background: "#F1F0F4", color: "#8D87A8" },
};

export function ApplyDone(): React.JSX.Element {
  const { applications, lastApplicationId } = partnersSlice.use();
  // Opening the page directly shows the sample application from the board.
  const app =
    applications.find((a) => a.id === lastApplicationId) ?? applications.find((a) => a.id === "a1") ?? applications[0];
  if (!app) return <></>;

  const firstName = app.applicant.split(" ")[0] ?? app.applicant;
  const steps: { title: string; text: string; state: StepState }[] = [
    { title: "Application received", text: app.submitted, state: "done" },
    {
      title: "Review by a partner manager",
      text: "They check your company and may call you to learn how you sell.",
      state: "now",
    },
    { title: "Decision by email", text: "If approved, you get an invite to set up your portal login.", state: "next" },
    { title: "Set up your account", text: "Accept the partner agreement and invite your colleagues.", state: "next" },
  ];

  return (
    <PublicSplit
      label="Application status"
      tag="Partner program"
      footerLeft="CleanStart Partner Program"
      asideLabel="What partners get"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Once you are approved
          </h2>
          <BulletList
            items={[
              "Your own login to the CleanStart Partner Portal",
              "90 days of protection on deals CleanStart accepts",
              "Private datasheets, videos and playbooks",
              "A named partner manager for your region",
            ]}
          />
        </div>
      }
    >
      <div
        role="status"
        data-tour="apply-done"
        style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}
      >
        <StatusIcon d={CHECK_D} tone="green" />
        <PublicHeading title="Application received">
          Thanks, {firstName}. {app.company}'s application is with the CleanStart partner team.
          {app.email ? ` We sent a copy to ${app.email}.` : ""}
        </PublicHeading>
        <ol
          aria-label="What happens next"
          style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}
        >
          {steps.map((step) => (
            <li
              key={step.title}
              style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 12, paddingBottom: 14 }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  ...DOT_STYLE[step.state],
                }}
              >
                <Icon d={step.state === "done" ? CHECK_D : DOT_D} small />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {step.title}
                  <span className="sr">{STATE_LABEL[step.state]}</span>
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#6B687D" }}>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <dl
          className="dl"
          style={{
            gridTemplateColumns: "110px minmax(0, 1fr)",
            padding: 12,
            borderRadius: 8,
            background: "#FAFAFB",
            border: "1px solid #ECEBF1",
          }}
        >
          <dt>Reference</dt>
          <dd className="tnum">{app.reference}</dd>
          <dt>Company</dt>
          <dd>{app.company}</dd>
          <dt>Category</dt>
          <dd>{app.category}</dd>
          <dt>Region</dt>
          <dd>{app.region}</dd>
        </dl>
        <p style={{ margin: 0, fontSize: 12.5, color: "#6B687D" }}>
          Questions? Reply to the confirmation email and it reaches the partner team.
        </p>
      </div>
    </PublicSplit>
  );
}
