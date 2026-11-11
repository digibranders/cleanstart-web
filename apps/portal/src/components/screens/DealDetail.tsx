"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { type Deal, PRODUCTS, postDealMessage, requestExtension, useDeals } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { acceptedOn, sameCustomer, stageTrack, waitDays } from "../deals/derive";
import { daysLeft, fmtLong, fmtShort, plural, PROTECTION_DAYS } from "../deals/dates";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { ProductMark, StatusBadge } from "../deals/parts";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import { Icon } from "../icon";
import { KESTREL } from "../shell/personas";
import { Dialog } from "../ui/overlay";
import { useToast } from "../ui/toast";

interface SummaryKpi {
  label: string;
  value: React.ReactNode;
  foot: React.ReactNode;
  small?: boolean;
}

function summaryFor(deal: Deal): SummaryKpi[] {
  const crm: SummaryKpi = {
    label: "CRM reference",
    value: deal.crmRef ?? (deal.status === "Pending" || deal.status === "Rejected" ? "Not created" : "Not recorded"),
    foot: deal.crmSynced ?? (deal.status === "Pending" ? "Created when accepted" : "In CleanStart's CRM"),
    small: true,
  };
  switch (deal.status) {
    case "Accepted": {
      const end = deal.protectionEnd ?? deal.registered;
      const left = daysLeft(end);
      const accepted = acceptedOn(deal);
      return [
        { label: "Protected until", value: fmtLong(end), foot: accepted ? `Accepted ${fmtLong(accepted)}` : "Protected" },
        {
          label: "Days left",
          value: (
            <>
              {left}{" "}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6B687D" }}>of {PROTECTION_DAYS}</span>
            </>
          ),
          foot: (
            <span className="bar" style={{ marginTop: 4, display: "block" }}>
              <span style={{ width: `${Math.max(0, Math.min(100, Math.round((left / PROTECTION_DAYS) * 100)))}%` }} />
            </span>
          ),
        },
        crm,
      ];
    }
    case "Pending": {
      const days = waitDays(deal);
      return [
        { label: "Protection", value: "Starts when accepted", foot: `${PROTECTION_DAYS} days from acceptance`, small: true },
        { label: "Waiting", value: days === 0 ? "Today" : plural(days, "day"), foot: "CleanStart reviews within 2 business days" },
        crm,
      ];
    }
    case "Rejected":
      return [
        { label: "Protection", value: "Not protected", foot: deal.decidedOn ? `Not accepted ${fmtShort(deal.decidedOn)}` : "Not accepted", small: true },
        { label: "Reviewed by", value: deal.decidedBy ?? deal.manager, foot: "Partner manager", small: true },
        crm,
      ];
    default:
      return [
        {
          label: deal.status === "Expired" ? "Ended" : "Closed",
          value: fmtLong(deal.closedOn ?? deal.registered),
          foot: deal.stage,
        },
        { label: "Outcome", value: deal.status, foot: "From CleanStart's CRM" },
        crm,
      ];
  }
}

function NotFound(): React.JSX.Element {
  return (
    <div className="wrap">
      <div className="head">
        <h1 className="h1">Deal not found</h1>
      </div>
      <section className="card card-b" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: "#5E5B6E" }}>
          This deal does not exist, or it belongs to another company.
        </span>
        <Link href={ROUTES.partner.deals} className="btn btn-s">
          Back to Deals
        </Link>
      </section>
    </div>
  );
}

export function DealDetail({ id }: { id: string }): React.JSX.Element {
  const toast = useToast();
  const all = useDeals();
  const deal = all.find((d) => d.id === id && d.partner === KESTREL.org);

  const [draft, setDraft] = useState("");
  const [draftTried, setDraftTried] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [extWhy, setExtWhy] = useState("");
  const [extTried, setExtTried] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [messageSubject, setMessageSubject] = useState<string | null>(null);
  // stable, because the overlay re-focuses its first field whenever onClose changes
  const closeExt = useCallback(() => setExtOpen(false), []);

  if (!deal) return <NotFound />;

  const track = stageTrack(deal);
  const summary = summaryFor(deal);
  const primary = deal.contacts[0];
  const siblings = all.filter((d) => d.partner === deal.partner && sameCustomer(d.customer, deal.customer));
  const draftErr = draftTried && !draft.trim();
  const extErr = extTried && !extWhy.trim();

  const sendNote = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!draft.trim()) {
      setDraftTried(true);
      return;
    }
    postDealMessage(deal.id, draft);
    setDraft("");
    setDraftTried(false);
  };

  const sendExtension = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!extWhy.trim()) {
      setExtTried(true);
      return;
    }
    requestExtension(deal.id, extWhy);
    setExtOpen(false);
    setExtWhy("");
    toast("Extension requested. CleanStart will reply by email.");
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">{deal.customer}</h1>
          <StatusBadge status={deal.status} />
          <span className="badge b-neutral">
            <ProductMark product={deal.product} size={14} />
            {deal.product}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {deal.status === "Accepted" && !deal.extensionRequested ? (
            <button
              type="button"
              className="btn btn-s"
              onClick={() => {
                setExtTried(false);
                setExtOpen(true);
              }}
            >
              Request extension
            </button>
          ) : null}
          {deal.extensionRequested ? (
            <span className="badge b-violet" style={{ height: 30, padding: "0 10px" }}>
              Extension requested, CleanStart will reply by email
            </span>
          ) : null}
          {deal.status === "Rejected" ? (
            <button type="button" className="btn btn-p" onClick={() => setFixing(true)}>
              Fix and resubmit
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-s"
            onClick={() => setMessageSubject(`${deal.customer}, ${deal.product}`)}
          >
            Message partner manager
          </button>
        </div>
      </div>

      {deal.status === "Rejected" && deal.rejectionReason ? (
        <div className="note note-amber">
          <Icon name="warn" />
          <span>
            <b>Not accepted.</b> {deal.rejectionReason}
          </span>
        </div>
      ) : null}

      <section aria-label="Deal summary" className="card" data-tour="deal-stage">
        <div className="kpis">
          {summary.map((k) => (
            <div className="kpi" key={k.label}>
              <span className="kpi-l">{k.label}</span>
              <span
                className={`kpi-v${k.small ? " tnum" : ""}`}
                style={k.small ? { fontSize: 16, padding: "3px 0" } : undefined}
              >
                {k.value}
              </span>
              <span className="kpi-f">{k.foot}</span>
            </div>
          ))}
        </div>
        {track ? (
          <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #F0EFF4" }}>
            <div className="sec-h" style={{ marginBottom: 8 }}>
              <h2 className="sec-t" style={{ fontSize: 12 }}>
                Stage
              </h2>
              <span className="sec-s">From CleanStart's CRM</span>
            </div>
            <ol
              className="stages"
              aria-label="Deal stage"
              style={{ margin: 0, listStyle: "none", gridTemplateColumns: `repeat(${track.length}, minmax(0, 1fr))` }}
            >
              {track.map((step) => (
                <li
                  key={step.label}
                  className={`stg${step.state === "done" ? " stg-done" : step.state === "now" ? " stg-now" : ""}`}
                  aria-current={step.state === "now" ? "step" : undefined}
                >
                  <i />
                  {step.label}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <div className="row">
        <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <section aria-labelledby="reg" className="card">
            <div className="card-h">
              <h2 id="reg" className="card-t">
                Registration
              </h2>
              <span className="card-meta">
                Submitted {fmtLong(deal.registered)}
                {deal.registeredTime ? `, ${deal.registeredTime}` : ""}
              </span>
            </div>
            <div
              className="card-b"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "8px 24px" }}
            >
              <dl className="dl">
                <dt>Customer</dt>
                <dd>{deal.customer}</dd>
                <dt>Product</dt>
                <dd>{deal.product}</dd>
                <dt>Region</dt>
                <dd>{deal.region}</dd>
                <dt>Account manager</dt>
                <dd>{deal.manager}</dd>
              </dl>
              <dl className="dl">
                <dt>Contact</dt>
                <dd>{primary?.name ?? "Not recorded"}</dd>
                {primary?.email ? (
                  <>
                    <dt>Email</dt>
                    <dd>{primary.email}</dd>
                  </>
                ) : null}
                {primary?.phone ? (
                  <>
                    <dt>Phone</dt>
                    <dd className="tnum">{primary.phone}</dd>
                  </>
                ) : null}
                <dt>Registered by</dt>
                <dd>{deal.registeredBy ?? deal.partner}</dd>
              </dl>
            </div>
            {deal.notes ? (
              <div style={{ padding: "0 12px 12px" }}>
                <div className="note note-violet">
                  <span>{deal.notes}</span>
                </div>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="act" className="card clip">
            <div className="card-h">
              <h2 id="act" className="card-t">
                Activity
              </h2>
              <span className="card-meta">{plural(deal.history.length, "event")}</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Event</th>
                  <th scope="col">By</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {deal.history.map((e, index) => (
                  <tr key={`${e.when}-${index}`}>
                    <td className="tnum t-sec">{e.when}</td>
                    <td>{e.text}</td>
                    <td className="t-sec">{e.by}</td>
                    <td className="t-muted">{e.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="conv" className="card clip" data-tour="deal-thread">
            <div className="card-h">
              <h2 id="conv" className="card-t">
                Conversation with CleanStart
              </h2>
              <span className="card-meta">Farhan gets an email for each message</span>
            </div>
            {deal.thread.length > 0 ? (
              <ol style={{ margin: 0, padding: "4px 0", listStyle: "none" }}>
                {deal.thread.map((m) => (
                  <li
                    key={m.id}
                    style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10, padding: "8px 12px" }}
                  >
                    <span className={`av av-r ${m.self ? "av-me" : "av-2"}`}>{m.initials}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 600 }}>{m.who}</b>{" "}
                        <span className="t-muted">
                          {m.org}, {m.when}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: "#2A2838" }}>{m.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty">No messages yet. Write to Farhan about this deal.</div>
            )}
            <form
              onSubmit={sendNote}
              noValidate
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "10px 12px",
                borderTop: "1px solid #F0EFF4",
                background: "#FCFCFD",
              }}
            >
              <label className="sr" htmlFor="conv-in">
                Message about this deal
              </label>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <textarea
                  id="conv-in"
                  className={`field${draftErr ? " field-err" : ""}`}
                  rows={2}
                  placeholder="Write to Farhan about this deal"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-invalid={draftErr || undefined}
                />
                {draftErr ? <span className="err">Write a message first.</span> : null}
              </div>
              <button type="submit" className="btn btn-p">
                <Icon name="send" />
                Send
              </button>
            </form>
          </section>
        </div>

        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <section aria-labelledby="others" className="card clip">
            <div className="card-h">
              <h2 id="others" className="card-t">
                Other opportunities here
              </h2>
              <Link href={ROUTES.partner.newDeal} className="link-sm">
                Add
              </Link>
            </div>
            {PRODUCTS.filter((p) => p !== deal.product).map((product) => {
              const other = siblings.find((d) => d.product === product);
              return (
                <div className="li" key={product}>
                  <ProductMark product={product} />
                  <span className="li-t">
                    <span className="li-n">{product}</span>
                    <span className="li-s">
                      {other
                        ? `Registered ${fmtShort(other.registered)}${other.registeredBy ? `, ${other.registeredBy}` : ""}`
                        : "Not registered yet"}
                    </span>
                  </span>
                  {other ? (
                    <Link href={ROUTES.partner.deal(other.id)}>
                      <StatusBadge status={other.status} />
                    </Link>
                  ) : (
                    <Link
                      href={ROUTES.partner.newDeal}
                      className="btn btn-g"
                      style={{ height: 24, padding: "0 6px", fontSize: 12 }}
                    >
                      Register
                    </Link>
                  )}
                </div>
              );
            })}
          </section>
          <section aria-labelledby="contacts" className="card clip">
            <div className="card-h">
              <h2 id="contacts" className="card-t">
                Contacts
              </h2>
              <span className="card-meta">{deal.contacts.length}</span>
            </div>
            {deal.contacts.length === 0 ? <div className="empty">No contacts added yet.</div> : null}
            {deal.contacts.map((c, index) => (
              <div className="li" key={`${c.name}-${index}`}>
                <span className="av av-3 av-r">{c.name.split(" ").map((w) => w.charAt(0)).join("").slice(0, 2)}</span>
                <span className="li-t">
                  <span className="li-n">{c.name}</span>
                  <span className="li-s">
                    {index === 0 ? (c.role ? `${c.role}, primary contact` : "Primary contact") : (c.role ?? "Contact")}
                  </span>
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>

      <Dialog
        open={extOpen}
        onClose={closeExt}
        title="Request an extension"
        subtitle={`${deal.customer}, ${deal.product}. Protection ends ${deal.protectionEnd ? fmtLong(deal.protectionEnd) : "when the registration closes"}.`}
        onSubmit={sendExtension}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={closeExt}>
              Cancel
            </button>
            <button type="submit" className="btn btn-p">
              Send request
            </button>
          </>
        }
      >
        <div className="fg">
          <label htmlFor="ext-why" className="lbl">
            Why do you need more time?
          </label>
          <textarea
            id="ext-why"
            className={`field${extErr ? " field-err" : ""}`}
            rows={5}
            value={extWhy}
            onChange={(e) => setExtWhy(e.target.value)}
            aria-invalid={extErr || undefined}
            aria-describedby={extErr ? "ext-why-err" : undefined}
          />
          {extErr ? (
            <span className="err" id="ext-why-err">
              Tell CleanStart why you need more time.
            </span>
          ) : null}
        </div>
        <span className="hint">Your partner manager decides and replies by email.</span>
      </Dialog>

      {fixing && deal.status === "Rejected" ? (
        <RejectedDealDrawer
          deal={deal}
          onClose={() => setFixing(false)}
          onMessage={() => {
            setFixing(false);
            setMessageSubject(`${deal.customer}, ${deal.product}`);
          }}
        />
      ) : null}
      {messageSubject !== null ? (
        <ManagerMessageDrawer
          key={messageSubject}
          persona={KESTREL}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
    </div>
  );
}
