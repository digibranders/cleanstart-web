"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { fmtLong } from "@/lib/dates";
import { findCountry } from "@/lib/deal-form";
import { PARTNER_CATEGORY_LABEL, PRODUCT_LABEL, type Product } from "@/lib/domain";
import { useRegions } from "@/components/regions-context";
import type { ApplicationDto, ApplicationNoteDto } from "@/lib/dto";
import {
  addApplicationNoteAction,
  listApplicationNotesAction,
  requestApplicationInfoAction,
} from "@/server/actions/applications";

const STATUS_LABEL: Record<ApplicationDto["status"], string> = {
  new: "Waiting for a decision",
  info_requested: "Waiting for the applicant's answer",
  approved: "Approved, invite sent",
  declined: "Rejected, emailed",
};

const KIND_LABEL: Record<ApplicationNoteDto["kind"], string> = {
  internal: "Internal note",
  info_request: "Question sent to the applicant",
  applicant_reply: "Applicant's answer",
};

const list = (values: readonly string[]): string => (values.length > 0 ? values.join(", ") : "Not given");

interface ApplicationDrawerProps {
  application: ApplicationDto | null;
  onClose: () => void;
  /** Partner managers decide and ask questions; other staff read and add notes. */
  canDecide: boolean;
}

/** Every answer on one application, the reviewers' notes and the "request more information" action. */
export function ApplicationDrawer({ application, onClose, canDecide }: ApplicationDrawerProps): React.JSX.Element | null {
  const toast = useToast();
  const router = useRouter();
  const { name: regionName } = useRegions();
  const [notes, setNotes] = useState<ApplicationNoteDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [tried, setTried] = useState<"note" | "question" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = application?.id ?? null;

  useEffect(() => {
    setNotes(null);
    setLoadError(null);
    setNote("");
    setQuestion("");
    setAsking(false);
    setTried(null);
    setError(null);
    if (!id) return;
    let live = true;
    void listApplicationNotesAction({ id }).then((result) => {
      if (!live) return;
      if (result.ok) setNotes(result.data);
      else setLoadError(result.error.message);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (!application) return null;
  const a = application;
  const open = a.status === "new" || a.status === "info_requested";

  const addNote = async (): Promise<void> => {
    setTried("note");
    setError(null);
    if (!note.trim()) return;
    setBusy(true);
    const result = await addApplicationNoteAction({ id: a.id, note });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setNotes((prev) => [...(prev ?? []), result.data]);
    setNote("");
    setTried(null);
  };

  const askForInfo = async (): Promise<void> => {
    setTried("question");
    setError(null);
    if (!question.trim()) return;
    setBusy(true);
    const result = await requestApplicationInfoAction({ id: a.id, message: question });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`Question sent to ${a.applicantName}`);
    router.refresh();
    onClose();
  };

  const country = a.country ? (findCountry(a.country)?.name ?? a.country) : null;
  const rows: Array<[string, React.ReactNode]> = [
    ["Reference", <span className="tnum" key="r">{a.reference}</span>],
    ["Status", STATUS_LABEL[a.status]],
    ["Submitted", fmtLong(a.submittedAt)],
    ["Source", a.source === "website" ? "Website form" : "Portal form"],
    ["Applicant", `${a.applicantName}${a.role ? `, ${a.role}` : ""}`],
    ["Email", a.email],
    ["Phone", a.phone ?? "Not given"],
    ["Company", `${a.company} (${a.domain})`],
    ["Partner type", a.category ? PARTNER_CATEGORY_LABEL[a.category] : "Not set"],
    ["Region", a.region ? regionName(a.region) : "Not set"],
    ["Country", country ?? "Not given"],
    ["Company size", a.companySize ?? "Not given"],
    ["Years in business", a.yearsInBusiness ?? "Not given"],
    ["Vendors today", list(a.vendors)],
    ["Products", list(a.products.map((p) => PRODUCT_LABEL[p as Product] ?? p))],
    ["Industries", list(a.verticals)],
    ["Heard about us", a.referralSource ?? "Not given"],
    ["Privacy consent", a.consentAt ? fmtLong(a.consentAt) : "Not recorded"],
  ];

  return (
    <Drawer open onClose={onClose} title={a.company} subtitle={`Application ${a.reference}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <dl className="dl" style={{ gridTemplateColumns: "130px minmax(0, 1fr)", margin: 0 }}>
          {rows.map(([label, value]) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
        <div>
          <span className="lbl">Why they want to partner</span>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{a.reason ?? "Not given."}</p>
          {a.declineReason ? (
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              <b>Reason sent:</b> {a.declineReason}
            </p>
          ) : null}
        </div>

        <section aria-label="Notes and replies" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="lbl">Notes and replies</span>
          {notes === null && !loadError ? <span className="hint">Loading notes.</span> : null}
          {loadError ? <span className="err">{loadError}</span> : null}
          {notes?.length === 0 ? <span className="hint">No notes yet. Notes are internal; the applicant never sees them.</span> : null}
          {notes?.map((n) => (
            <div key={n.id} className={`note ${n.kind === "internal" ? "note-violet" : "note-amber"}`} style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {KIND_LABEL[n.kind]}
                {n.authorName ? `, ${n.authorName}` : ""}
                <span className="t-muted"> {fmtLong(n.createdAt)}</span>
              </span>
              <span style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{n.note}</span>
            </div>
          ))}
          <div className="fg">
            <label htmlFor="app-note" className="lbl">
              Add an internal note
            </label>
            <textarea
              id="app-note"
              className={`field${tried === "note" && !note.trim() ? " field-err" : ""}`}
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={tried === "note" && !note.trim() ? true : undefined}
            />
            {tried === "note" && !note.trim() ? <span className="err">Write the note first.</span> : null}
          </div>
          <button type="button" className="btn btn-s" style={{ alignSelf: "flex-start" }} onClick={() => void addNote()} disabled={busy}>
            Add note
          </button>
        </section>

        {canDecide && open ? (
          <section aria-label="Request more information" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {asking ? (
              <>
                <div className="fg">
                  <label htmlFor="app-question" className="lbl">
                    What do you need to know? (the applicant sees this)
                  </label>
                  <textarea
                    id="app-question"
                    className={`field${tried === "question" && !question.trim() ? " field-err" : ""}`}
                    rows={3}
                    maxLength={1000}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    aria-invalid={tried === "question" && !question.trim() ? true : undefined}
                  />
                  {tried === "question" && !question.trim() ? <span className="err">Write what you need to know.</span> : null}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-s" onClick={() => setAsking(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-p" onClick={() => void askForInfo()} disabled={busy}>
                    Email the question
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn btn-s" style={{ alignSelf: "flex-start" }} onClick={() => setAsking(true)}>
                {a.status === "info_requested" ? "Ask another question" : "Request more information"}
              </button>
            )}
          </section>
        ) : null}
        {error ? (
          <span className="err" role="alert">
            {error}
          </span>
        ) : null}
        {a.status === "info_requested" ? <Badge tone="pending">Waiting for the applicant</Badge> : null}
      </div>
    </Drawer>
  );
}
