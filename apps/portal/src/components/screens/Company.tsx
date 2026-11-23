"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { DetailsFields, detailsOf, LogoEditor, sameDetails, saveDetails } from "@/components/partners/company-details";
import { MessageDrawer } from "@/components/partners/message-drawer";
import { PartnerCategoryBadge, PartnerStatusBadge } from "@/components/partners/badges";
import { Avatar, Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fmtLong } from "@/lib/dates";
import { RegionName } from "@/components/regions-context";
import type { CompanyDto } from "@/lib/dto";
import type { CompanyDetailsInput } from "@/lib/company-profile";
import { initialsOf } from "@/lib/people";
import { updateCompanyProfileAction } from "@/server/actions/partners";

interface ProfileFields {
  website: string;
  phone: string;
  address: string;
  about: string;
}

const fieldsOf = (company: CompanyDto): ProfileFields => ({
  website: company.website ?? "",
  phone: company.phone ?? "",
  address: company.address ?? "",
  about: company.about ?? "",
});

const SAME = (a: ProfileFields, b: ProfileFields): boolean =>
  a.website === b.website && a.phone === b.phone && a.address === b.address && a.about === b.about;

interface CompanyProps {
  company: CompanyDto;
  /** Partner admins edit the profile; other roles read it. */
  canEdit: boolean;
  viewerEmail: string;
}

export function Company({ company, canEdit, viewerEmail }: CompanyProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const saved = fieldsOf(company);
  // null until the admin types: the form then shows the saved profile without copying it into state.
  const [draft, setDraft] = useState<ProfileFields | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = draft ?? saved;
  const dirty = draft !== null && !SAME(draft, saved);
  const edit = (key: keyof ProfileFields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
    setDraft({ ...form, [key]: event.target.value });

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!dirty) {
      setDraft(null);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateCompanyProfileAction(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDraft(null);
    toast("Company profile saved");
  };

  // Held locally after a save so the card does not flash the old values while the refreshed page is on its way.
  const [savedDetails, setSavedDetails] = useState(() => detailsOf(company));
  const [detailsDraft, setDetailsDraft] = useState<CompanyDetailsInput | null>(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsErrors, setDetailsErrors] = useState<Partial<Record<keyof CompanyDetailsInput | "form", string>>>({});
  const [logoUrl, setLogoUrl] = useState(company.logoUrl);
  const detailsForm = detailsDraft ?? savedDetails;
  const detailsDirty = detailsDraft !== null && !sameDetails(detailsDraft, savedDetails);

  const saveCompanyDetails = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!detailsDirty) return;
    setDetailsSaving(true);
    setDetailsErrors({});
    const result = await saveDetails(undefined, detailsForm);
    setDetailsSaving(false);
    if (!result.ok) {
      setDetailsErrors(result.errors);
      return;
    }
    setSavedDetails(detailsForm);
    setDetailsDraft(null);
    toast("Company details saved");
    router.refresh();
  };

  const manager = company.manager;
  const teamName = manager ? manager.team.replace(/^CleanStart\s*/, "") : "";
  const signed = company.agreementAcceptedAt !== null;

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Company</h1>
          <span className="h1-sub">How CleanStart sees {company.name}. Partner admins can edit the profile.</span>
        </div>
      </div>

      <div className="row">
        <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <form
          onSubmit={save}
          noValidate
          aria-labelledby="prof"
          className="card clip"
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
                <input id="cn" className="field" type="text" value={company.name} readOnly aria-describedby="cn-hint" />
                <span id="cn-hint" className="hint">
                  Ask your partner manager to change the name.
                </span>
              </div>
              <div className="fg">
                <label htmlFor="cw" className="lbl">
                  Website
                </label>
                <input
                  id="cw"
                  className="field"
                  type="text"
                  value={form.website}
                  onChange={edit("website")}
                  readOnly={!canEdit}
                  aria-describedby={canEdit ? "cw-hint" : undefined}
                />
                {canEdit ? (
                  <span id="cw-hint" className="hint">
                    For example, https://example.com
                  </span>
                ) : null}
              </div>
              <div className="fg">
                <label htmlFor="cp" className="lbl">
                  Main phone
                </label>
                <input
                  id="cp"
                  className="field"
                  type="tel"
                  value={form.phone}
                  onChange={edit("phone")}
                  readOnly={!canEdit}
                  aria-describedby={canEdit ? "cp-hint" : undefined}
                />
                {canEdit ? (
                  <span id="cp-hint" className="hint">
                    With country code, for example +91 98765 43210
                  </span>
                ) : null}
              </div>
            </div>
            <div className="fg">
              <label htmlFor="ca" className="lbl">
                Address
              </label>
              <input
                id="ca"
                className="field"
                type="text"
                value={form.address}
                onChange={edit("address")}
                readOnly={!canEdit}
                aria-describedby={canEdit ? "ca-hint" : undefined}
              />
              {canEdit ? (
                <span id="ca-hint" className="hint">
                  Your main office: street, city and country
                </span>
              ) : null}
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
                readOnly={!canEdit}
                aria-describedby="cb-hint"
              />
              <span id="cb-hint" className="hint">
                Shown to your CleanStart partner manager.
              </span>
            </div>
            {error ? (
              <span className="err" role="alert">
                {error}
              </span>
            ) : null}
          </div>
          <hr className="hr" />
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sec-h" style={{ margin: 0 }}>
              <h3 className="sec-t">Set by CleanStart</h3>
              <span className="sec-s">Ask your partner manager to change these</span>
            </div>
            <dl className="dl">
              <dt>Partner category</dt>
              <dd>
                <PartnerCategoryBadge category={company.category} />
              </dd>
              <dt>Region</dt>
              <dd><RegionName k={company.region} /></dd>
              <dt>Partner since</dt>
              <dd>{fmtLong(company.since)}</dd>
              <dt>Status</dt>
              <dd>
                <PartnerStatusBadge status={company.status} />
              </dd>
            </dl>
          </div>
          {canEdit ? (
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
                    setError(null);
                  }}
                >
                  Discard
                </button>
              ) : null}
              <button type="submit" className="btn btn-p" disabled={!dirty || saving}>
                Save changes
              </button>
            </div>
          ) : null}
        </form>

        <form onSubmit={saveCompanyDetails} noValidate aria-labelledby="det" className="card clip">
          <div className="card-h">
            <h2 id="det" className="card-t">
              Company details
            </h2>
            {detailsSaving ? (
              <span className="card-meta" role="status">Saving</span>
            ) : detailsDirty ? (
              <span className="card-meta t-amber">Unsaved changes</span>
            ) : (
              <span className="card-meta">{canEdit ? "All changes saved" : "Read only"}</span>
            )}
          </div>
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <LogoEditor name={company.name} logoUrl={logoUrl} canEdit={canEdit} onChanged={(next) => { setLogoUrl(next); router.refresh(); }} />
            <DetailsFields values={detailsForm} onChange={(next) => {
                setDetailsDraft(next);
                setDetailsErrors({});
              }} readOnly={!canEdit} errors={detailsErrors} idPrefix="co" />
            {detailsErrors.form && Object.keys(detailsErrors).length === 1 ? (
              <span className="err" role="alert">
                {detailsErrors.form}
              </span>
            ) : null}
          </div>
          {canEdit ? (
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
              {detailsDirty ? (
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => {
                    setDetailsDraft(null);
                    setDetailsErrors({});
                  }}
                >
                  Discard
                </button>
              ) : null}
              <button type="submit" className="btn btn-p" disabled={!detailsDirty || detailsSaving}>
                Save details
              </button>
            </div>
          ) : null}
        </form>
        </div>

        <aside
          aria-label="Agreement and contacts"
          style={{ flex: "0 1 360px", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <section aria-labelledby="agr" className="card clip">
            <div className="card-h">
              <h2 id="agr" className="card-t">
                Partner agreement
              </h2>
              <Badge tone={signed ? "accepted" : "pending"}>{signed ? "Signed" : "Not signed"}</Badge>
            </div>
            <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <dl className="dl" style={{ gridTemplateColumns: "96px minmax(0, 1fr)" }}>
                <dt>Version</dt>
                <dd>{company.agreementVersion ?? "Not accepted yet"}</dd>
                <dt>Accepted</dt>
                <dd>
                  {company.agreementAcceptedAt
                    ? `${fmtLong(company.agreementAcceptedAt.slice(0, 10))}, ${company.agreementAcceptedAt.slice(11, 16)}`
                    : "Not accepted yet"}
                </dd>
              </dl>
              <button
                type="button"
                className="btn btn-s"
                style={{ alignSelf: "flex-start" }}
                onClick={() => toast("The agreement PDF is not in the portal yet. Ask your partner manager for a copy.")}
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
            {manager ? (
              <div className="li" style={{ borderBottom: 0 }}>
                <Avatar initials={initialsOf(manager.name)} />
                <span className="li-t">
                  <span className="li-n">{manager.name}</span>
                  <span className="li-s">CleanStart{teamName ? `, ${teamName}` : ""}</span>
                  <a href={`mailto:${manager.email}`} className="li-s">
                    {manager.email}
                  </a>
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
            ) : (
              <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>
                CleanStart has not assigned a partner manager yet.
              </p>
            )}
          </section>

          <section aria-labelledby="tier" className="card clip">
            <div className="card-h">
              <h2 id="tier" className="card-t">
                Tier
              </h2>
              <Badge tone="neutral">Not assigned</Badge>
            </div>
            <div className="card-b">
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
                CleanStart has not launched partner tiers yet.{" "}
                {manager ? manager.name.split(" ")[0] : "Your partner manager"} will share the tier rules with you
                before they start.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {messageOpen && manager ? (
        <MessageDrawer
          open
          onClose={() => setMessageOpen(false)}
          manager={manager.name}
          team={teamName || "CleanStart"}
          subject={`${company.name} company profile`}
          from={viewerEmail}
        />
      ) : null}
    </div>
  );
}
