"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import {
  CATEGORIES,
  emailDomain,
  findPartnerByDomain,
  isValidEmail,
  type NewPartnerInput,
  normaliseDomain,
  type Partner,
  type PartnerCategory,
} from "@/data/partners";
import { Seg } from "./seg";

const REGIONS = ["India", "Middle East"] as const;

interface AddPartnerDrawerProps {
  partners: readonly Partner[];
  onClose: () => void;
  onAdd: (input: NewPartnerInput) => void;
}

/** Mounted only while open, so every opening starts from a blank form. */
export function AddPartnerDrawer({ partners, onClose, onAdd }: AddPartnerDrawerProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState<PartnerCategory>("Channel partner");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("India");
  const [admin, setAdmin] = useState("");
  const [email, setEmail] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [tried, setTried] = useState(false);

  const domain = normaliseDomain(website) || emailDomain(email);
  const taken = findPartnerByDomain(partners, domain);
  const nameErr = tried ? (name.trim() ? (taken ? `${taken.name} already uses ${domain}.` : "") : "Enter the company name.") : "";
  const emailErr = tried && !isValidEmail(email) ? "Enter a valid work email." : "";

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setTried(true);
    if (!name.trim() || !isValidEmail(email) || taken) return;
    onAdd({ name, website, category, region, admin, email, sendInvite });
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
          <button type="submit" className="btn btn-p">
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
        <Seg options={CATEGORIES} value={category} onChange={setCategory} labelledBy="np-cat" />
      </div>
      <div className="fg">
        <span id="np-reg" className="lbl">
          Region
        </span>
        <Seg options={REGIONS} value={region} onChange={setRegion} labelledBy="np-reg" />
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
    </Drawer>
  );
}
