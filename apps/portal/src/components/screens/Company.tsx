"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { MessageDrawer } from "@/components/partners/message-drawer";
import { Avatar, Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  type CompanyProfile,
  initialsOf,
  KESTREL_ID,
  partnersSlice,
  saveCompanyProfile,
} from "@/data/partners";
import { CategoryBadge, StatusBadge } from "@/components/partners/badges";

const SAME = (a: CompanyProfile, b: CompanyProfile): boolean =>
  a.name === b.name && a.website === b.website && a.phone === b.phone && a.address === b.address && a.about === b.about;

export function Company(): React.JSX.Element {
  const toast = useToast();
  const { partners, profile } = partnersSlice.use();
  const partner = partners.find((p) => p.id === KESTREL_ID);
  // null until the admin types: the form then shows the saved profile without copying it into state.
  const [draft, setDraft] = useState<CompanyProfile | null>(null);
  const [tried, setTried] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const form = draft ?? profile;
  const dirty = draft !== null && !SAME(draft, profile);
  const nameErr = tried && !form.name.trim();
  const edit = (key: keyof CompanyProfile) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
    setDraft({ ...form, [key]: event.target.value });

  const save = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!form.name.trim()) {
      setTried(true);
      return;
    }
    if (dirty) saveCompanyProfile(form);
    setDraft(null);
    setTried(false);
  };

  const manager = partner?.manager ?? "Farhan Qureshi";
  const team = partner?.region === "Middle East" ? "Middle East" : "India";

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Company</h1>
          <span className="h1-sub">How CleanStart sees Kestrel Systems. Partner admins can edit the profile.</span>
        </div>
      </div>

      <div className="row">
        <form
          onSubmit={save}
          noValidate
          aria-labelledby="prof"
          className="card clip"
          style={{ flex: "1 1 620px", minWidth: 0 }}
        >
          <div className="card-h">
            <h2 id="prof" className="card-t">
              Company profile
            </h2>
            {dirty ? (
              <span className="card-meta t-amber">Unsaved changes</span>
            ) : (
              <span className="card-meta">All changes saved</span>
            )}
          </div>
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="grid3">
              <div className="fg">
                <label htmlFor="cn" className="lbl">
                  Company name
                </label>
                <input
                  id="cn"
                  className={`field${nameErr ? " field-err" : ""}`}
                  type="text"
                  value={form.name}
                  onChange={edit("name")}
                  aria-invalid={nameErr ? true : undefined}
                  aria-describedby="cn-err"
                />
                {nameErr ? (
                  <span className="err" id="cn-err">
                    Enter the company name.
                  </span>
                ) : null}
              </div>
              <div className="fg">
                <label htmlFor="cw" className="lbl">
                  Website
                </label>
                <input id="cw" className="field" type="text" value={form.website} onChange={edit("website")} />
              </div>
              <div className="fg">
                <label htmlFor="cp" className="lbl">
                  Main phone
                </label>
                <input id="cp" className="field" type="tel" value={form.phone} onChange={edit("phone")} />
              </div>
            </div>
            <div className="fg">
              <label htmlFor="ca" className="lbl">
                Address
              </label>
              <input id="ca" className="field" type="text" value={form.address} onChange={edit("address")} />
            </div>
            <div className="fg">
              <label htmlFor="cb" className="lbl">
                What you sell
              </label>
              <textarea
                id="cb"
                className="field"
                rows={3}
                value={form.about}
                onChange={edit("about")}
                aria-describedby="cb-hint"
              />
              <span id="cb-hint" className="hint">
                Shown to your CleanStart partner manager.
              </span>
            </div>
          </div>
          <hr className="hr" />
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sec-h" style={{ margin: 0 }}>
              <h3 className="sec-t">Set by CleanStart</h3>
              <span className="sec-s">Ask your partner manager to change these</span>
            </div>
            <dl className="dl">
              <dt>Partner category</dt>
              <dd>{partner ? <CategoryBadge category={partner.category} /> : null}</dd>
              <dt>Region</dt>
              <dd>{partner?.region ?? "India"}</dd>
              <dt>Partner since</dt>
              <dd>{partner?.since ?? "12 Mar 2026"}</dd>
              <dt>Status</dt>
              <dd>{partner ? <StatusBadge status={partner.status} /> : null}</dd>
            </dl>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
              padding: "10px 12px",
              borderTop: "1px solid #F0EFF4",
              background: "#FCFCFD",
            }}
          >
            {dirty ? (
              <button
                type="button"
                className="btn btn-g"
                onClick={() => {
                  setDraft(null);
                  setTried(false);
                }}
              >
                Discard
              </button>
            ) : null}
            <button type="submit" className="btn btn-p">
              Save changes
            </button>
          </div>
        </form>

        <aside
          aria-label="Agreement and contacts"
          style={{ flex: "0 1 360px", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <section aria-labelledby="agr" className="card clip">
            <div className="card-h">
              <h2 id="agr" className="card-t">
                Partner agreement
              </h2>
              <Badge tone="accepted">Signed</Badge>
            </div>
            <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <dl className="dl" style={{ gridTemplateColumns: "96px minmax(0, 1fr)" }}>
                <dt>Version</dt>
                <dd>1.2</dd>
                <dt>Accepted</dt>
                <dd>12 Mar 2026, 14:06</dd>
                <dt>Accepted by</dt>
                <dd>Aditi Rao</dd>
              </dl>
              <button
                type="button"
                className="btn btn-s"
                style={{ alignSelf: "flex-start" }}
                onClick={() => toast("Downloading partner agreement, version 1.2")}
              >
                <Icon name="dl" />
                Download PDF
              </button>
              <span className="hint">
                When CleanStart publishes a new version, you will be asked to accept it here.
              </span>
            </div>
          </section>

          <section aria-labelledby="pm" className="card clip">
            <div className="card-h">
              <h2 id="pm" className="card-t">
                Your partner manager
              </h2>
            </div>
            <div className="li" style={{ borderBottom: 0 }}>
              <Avatar initials={initialsOf(manager)} />
              <span className="li-t">
                <span className="li-n">{manager}</span>
                <span className="li-s">CleanStart, {team}</span>
              </span>
              <button
                type="button"
                className="btn btn-s"
                style={{ marginLeft: "auto", height: 26, padding: "0 8px", fontSize: 12 }}
                onClick={() => setMessageOpen(true)}
              >
                Message
              </button>
            </div>
          </section>

          <section aria-labelledby="tier" className="card clip" data-tour="company-tier">
            <div className="card-h">
              <h2 id="tier" className="card-t">
                Tier
              </h2>
              <Badge tone="neutral">Not assigned</Badge>
            </div>
            <div className="card-b">
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
                CleanStart has not launched partner tiers yet. Farhan will share the tier rules with you before they
                start.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {messageOpen ? (
        <MessageDrawer
          open
          onClose={() => setMessageOpen(false)}
          manager={manager}
          team={team}
          subject="Kestrel Systems company profile"
          from="aditi.rao@kestrelsystems.in"
        />
      ) : null}
    </div>
  );
}
