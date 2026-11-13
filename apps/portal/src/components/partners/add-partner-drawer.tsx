"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  type PartnerCategory,
  type PartnerRegion,
} from "@/lib/domain";
import type { PartnerListRow } from "@/lib/dto";
import { codeFromLabel, emailDomain, isValidEmail, normaliseDomain } from "@/lib/people";
import { Seg } from "./seg";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);
const REGIONS: readonly string[] = [PARTNER_REGION_LABEL.india, PARTNER_REGION_LABEL.middle_east];

export interface NewPartnerValues {
  name: string;
  website: string;
  category: PartnerCategory;
  region: PartnerRegion;
  adminName: string;
  adminEmail: string;
  sendInvite: boolean;
}

interface AddPartnerDrawerProps {
  partners: readonly PartnerListRow[];
  onClose: () => void;
  /** Resolves to an error message to show in the form, or null when the partner was added. */
  onAdd: (input: NewPartnerValues) => Promise<string | null>;
}

/** Mounted only while open, so every opening starts from a blank form. */
export function AddPartnerDrawer({ partners, onClose, onAdd }: AddPartnerDrawerProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryLabel, setCategoryLabel] = useState<string>(PARTNER_CATEGORY_LABEL.channel);
  const [regionLabel, setRegionLabel] = useState<string>(PARTNER_REGION_LABEL.india);
  const [admin, setAdmin] = useState("");
  const [email, setEmail] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const domain = normaliseDomain(website) || emailDomain(email);
  const taken = domain ? partners.find((p) => p.domain === domain) : undefined;
  const nameErr = tried
    ? name.trim()
      ? taken
        ? `${taken.name} already uses ${domain}.`
        : ""
      : "Enter the company name."
    : "";
  const emailErr = tried && !isValidEmail(email) ? "Enter a valid work email." : "";

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setServerError(null);
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, categoryLabel);
    const region = codeFromLabel(PARTNER_REGION_LABEL, regionLabel);
    if (!name.trim() || !isValidEmail(email) || taken || !category || !region) return;
    setBusy(true);
    const error = await onAdd({ name, website, category, region, adminName: admin, adminEmail: email, sendInvite });
    setBusy(false);
    if (error) setServerError(error);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      onSubmit={submit}
      title="Add a partner"
      subtitle="The partner admin gets an email to set a password and accept the partner agreement."
      footer={
        <>
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginRight: "auto", fontSize: 12.5 }}>
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              style={{ width: 14, height: 14, margin: 0, accentColor: "#4B23C8" }}
            />
            Email the invite now
          </label>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            {sendInvite ? "Add and send invite" : "Add partner"}
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="np-company" className="lbl">
          Company name
        </label>
        <input
          id="np-company"
          className={`field${nameErr ? " field-err" : ""}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameErr ? true : undefined}
          aria-describedby="np-company-err"
        />
        {nameErr ? (
          <span className="err" id="np-company-err">
            {nameErr}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="np-domain" className="lbl">
          Website
        </label>
        <input id="np-domain" className="field" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="fg">
        <span id="np-cat" className="lbl">
          Category
        </span>
        <Seg options={CATEGORY_OPTIONS} value={categoryLabel} onChange={setCategoryLabel} labelledBy="np-cat" />
      </div>
      <div className="fg">
        <span id="np-reg" className="lbl">
          Region
        </span>
        <Seg options={REGIONS} value={regionLabel} onChange={setRegionLabel} labelledBy="np-reg" />
      </div>
      <hr className="hr" />
      <div className="fg">
        <label htmlFor="np-admin" className="lbl">
          Partner admin name
        </label>
        <input id="np-admin" className="field" type="text" value={admin} onChange={(e) => setAdmin(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="np-email" className="lbl">
          Partner admin work email
        </label>
        <input
          id="np-email"
          className={`field${emailErr ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr ? true : undefined}
          aria-describedby="np-email-err"
        />
        {emailErr ? (
          <span className="err" id="np-email-err">
            {emailErr}
          </span>
        ) : null}
      </div>
      {serverError ? (
        <span className="err" role="alert">
          {serverError}
        </span>
      ) : null}
    </Drawer>
  );
}
