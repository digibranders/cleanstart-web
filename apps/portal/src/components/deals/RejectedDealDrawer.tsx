"use client";

import { useState } from "react";
import { PRODUCT_LABEL } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { resubmitRegistrationAction } from "@/server/actions/registrations";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { fmtShort } from "./dates";
import { firstWord } from "./derive";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Shows why CleanStart did not accept a registration and lets the partner fix it and resubmit. */
export function RejectedDealDrawer({
  deal,
  onClose,
  onMessage,
}: {
  deal: RegistrationListItem;
  onClose: () => void;
  onMessage: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameErr = tried && !name.trim();
  const emailErr = tried && !EMAIL.test(email.trim());

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!name.trim() || !EMAIL.test(email.trim())) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await resubmitRegistrationAction({
      id: deal.id,
      contact: { name, role: title, email },
      note,
    });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    toast("Resubmitted. CleanStart will review it again.");
    onClose();
  };

  const decided = deal.decidedOn
    ? ` Not accepted on ${fmtShort(deal.decidedOn)} by ${deal.decidedByLabel ?? "CleanStart"}.`
    : "";

  return (
    <Drawer
      open
      onClose={onClose}
      title={deal.customer}
      subtitle={`${PRODUCT_LABEL[deal.product]}.${decided}`}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-g" onClick={onMessage} style={{ marginRight: "auto" }}>
            Message {firstWord(deal.managerName ?? "your partner manager")}
          </button>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Resubmit
          </button>
        </>
      }
    >
      <div className="fg">
        <span className="lbl">Why it was not accepted</span>
        <div className="note note-amber">
          <Icon name="warn" />
          <span>{deal.rejectionReason}</span>
        </div>
      </div>
      <hr className="hr" />
      <h3 className="sec-t" style={{ margin: 0 }}>
        Fix and resubmit
      </h3>
      <div className="grid2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className="fg">
          <label htmlFor="rs-name" className="lbl">
            Contact name
          </label>
          <input
            id="rs-name"
            className={`field${nameErr ? " field-err" : ""}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameErr || undefined}
            aria-describedby={nameErr ? "rs-name-err" : undefined}
          />
          {nameErr ? (
            <span className="err" id="rs-name-err">
              Enter the contact's name.
            </span>
          ) : null}
        </div>
        <div className="fg">
          <label htmlFor="rs-title" className="lbl">
            Job title
          </label>
          <input id="rs-title" className="field" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="fg">
        <label htmlFor="rs-email" className="lbl">
          Work email
        </label>
        <input
          id="rs-email"
          className={`field${emailErr ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr || undefined}
          aria-describedby={emailErr ? "rs-email-err" : undefined}
        />
        {emailErr ? (
          <span className="err" id="rs-email-err">
            Enter a valid work email.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="rs-note" className="lbl">
          What changed <span className="hint">(optional)</span>
        </label>
        <textarea id="rs-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
    </Drawer>
  );
}
