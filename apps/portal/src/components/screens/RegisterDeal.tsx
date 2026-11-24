"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  blankForm,
  COUNTRIES,
  type DealDraft,
  type DealFormState,
  draftKey,
  findCountry,
  hasContent,
  INDUSTRIES,
  MAX_CONTACTS,
  newContact,
  parseDraft,
  SALES_STAGES,
  serializeDraft,
  toRegisterInput,
  validateDealForm,
} from "@/lib/deal-form";
import { REVIEW_SLA_BUSINESS_DAYS, PROTECTION_DAYS as PROTECTION_WINDOW_DAYS } from "@/lib/deal-rules";
import {
  DEAL_CURRENCIES,
  type DealCurrency,
  type DealRegion,
  type PartnerRegion,
  PRODUCT_LABEL,
  PRODUCTS,
  type Product,
} from "@/lib/domain";
import type { CustomerSuggestionDto, ManagerOptionDto, RegisterAgainDto, RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { staffDealHref } from "@/lib/staff-deals-dto";
import { lookupCustomerAction, registerDealsAction } from "@/server/actions/registrations";
import { issuesToErrors } from "@/server/actions/result";
import { fmtLong, fmtShort } from "../deals/dates";
import { managerFor, protectionView, reviewSince, sameCustomer } from "../deals/derive";
import { type PartnerChoice, PartnerPicker } from "../deals/PartnerPicker";
import { ProductMark, StatusBadge } from "../deals/parts";
import type { CustomerLookupResult } from "../deals/types";
import { Icon } from "../icon";
import { Combobox } from "../ui/combobox";
import { DatePicker } from "../ui/date-picker";
import { Dropdown } from "../ui/dropdown";
import { ConfirmDialog } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { useRegions } from "@/components/regions-context";

const PRODUCT_DESC: Record<Product, string> = {
  images: "Zero-CVE hardened images",
  libraries: "Verified dependencies",
  cleansight: "Vulnerability detection",
};

const EMPTY_OWN: CustomerSuggestionDto[] = [];

const SECTION_STYLE = { border: 0, margin: 0, padding: "14px 14px 16px" } as const;
const COLUMN_STYLE = { display: "flex", flexDirection: "column", gap: 12 } as const;

interface Submitted {
  customer: string;
  deals: Array<{ id: string; product: Product; reference: string }>;
}

function dealMeta(deal: RegistrationListItem, today: string): string {
  if (deal.status === "accepted" && deal.protectionEnd) return `Protected until ${fmtLong(deal.protectionEnd)}`;
  if (deal.status === "pending") return `Sent ${fmtShort(reviewSince(deal))}`;
  return protectionView(deal, "overview", today).until;
}

interface RegisterDealProps {
  mine: RegistrationListItem[];
  managers: ManagerOptionDto[];
  partnerName: string;
  /** The partner's own region; a partner in a region that is no longer offered starts on the first active region. */
  partnerRegion: PartnerRegion | undefined;
  today: string;
  /** Keys the saved draft, so two people on one browser never see each other's. */
  userId: string;
  /** Set by /partner/deals/new?from=<id>: the customer to register again. */
  source: RegisterAgainDto | null;
  /** Staff (partner managers) registering for a partner: adds the partner picker and points the links at the staff screens. */
  onBehalf?: { partners: PartnerChoice[] };
}

const fromSource = (base: DealFormState, source: RegisterAgainDto): DealFormState => ({
  ...base,
  customer: source.customer,
  site: source.website ?? "",
  country: source.country ? (findCountry(source.country)?.name ?? source.country) : "",
  industry: source.industry ?? "",
  contacts:
    source.contacts.length > 0
      ? source.contacts.map((c) => newContact({ name: c.name, role: c.role ?? "", email: c.email ?? "", phone: c.phone ?? "" }))
      : [newContact()],
});

function readDraft(userId: string): DealDraft | null {
  try {
    return parseDraft(window.localStorage.getItem(draftKey(userId)));
  } catch {
    return null;
  }
}

function writeDraft(userId: string, raw: string | null): void {
  try {
    if (raw === null) window.localStorage.removeItem(draftKey(userId));
    else window.localStorage.setItem(draftKey(userId), raw);
  } catch {
    // Storage can be full or blocked; the form still works without a draft.
  }
}

export function RegisterDeal({ mine, managers, partnerName: ownPartnerName, partnerRegion, today, userId, source, onBehalf }: RegisterDealProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState("");
  const pickedPartner = onBehalf?.partners.find((p) => p.id === partnerId);
  const partnerName = onBehalf ? (pickedPartner?.name ?? "The partner") : ownPartnerName;
  const dealHref = (id: string): string => (onBehalf ? staffDealHref(id) : ROUTES.partner.deal(id));
  const listHref = onBehalf ? ROUTES.admin.approvals : ROUTES.partner.deals;
  const { offer } = useRegions();
  const activeRegions = offer();
  const regionFor = (key: string | undefined): DealRegion => (activeRegions.some((r) => r.key === key) ? (key as DealRegion) : (activeRegions[0]?.key ?? "india"));
  const homeRegion = regionFor(partnerRegion);
  const blank = useMemo(() => blankForm(homeRegion, managerFor(managers, homeRegion)), [homeRegion, managers]);
  const [baseline, setBaseline] = useState<DealFormState>(() => (source ? fromSource(blank, source) : blank));
  const [form, setForm] = useState<DealFormState>(baseline);
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [remote, setRemote] = useState<{ q: string; data: CustomerLookupResult } | null>(null);
  const [draft, setDraft] = useState<DealDraft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const leaving = useRef(false);

  const patch = (change: Partial<DealFormState>): void => {
    setForm((prev) => ({ ...prev, ...change }));
    setServerErrors({});
  };
  const touch = (key: string): void => setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  const live = useMemo(() => validateDealForm(form, today), [form, today]);
  const fieldError = (key: string): string | undefined => ((tried || touched.has(key)) && live[key]) || serverErrors[key];

  const dirty = !submitted && hasContent(form, baseline);

  const customer = form.customer.trim();
  const needle = customer.toLowerCase();

  const remoteOwn = remote?.q === customer ? remote.data.own : EMPTY_OWN;
  const known = useMemo(() => {
    const byName = new Map<string, { name: string; site: string; count: number }>();
    for (const d of mine) {
      const key = d.customer.toLowerCase();
      const entry = byName.get(key) ?? { name: d.customer, site: "", count: 0 };
      entry.site = entry.site || d.website || "";
      entry.count += 1;
      byName.set(key, entry);
    }
    for (const s of remoteOwn) {
      const key = s.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, { name: s.name, site: s.website ?? "", count: s.registrations.length });
    }
    return [...byName.values()];
  }, [mine, remoteOwn]);

  const exact = known.find((c) => c.name.toLowerCase() === needle);
  const exactDeals = mine
    .filter((d) => sameCustomer(d.customer, customer))
    .sort((a, b) => a.registeredOn.localeCompare(b.registeredOn));
  const suggestions =
    needle.length >= 2 && !exact
      ? known.filter((c) => `${c.name} ${c.site}`.toLowerCase().includes(needle)).slice(0, 5)
      : [];

  const held = form.picked.flatMap((product) => {
    const deal = mine.find(
      (d) => sameCustomer(d.customer, customer) && d.product === product && (d.status === "accepted" || d.status === "pending"),
    );
    return deal ? [{ deal }] : [];
  });

  const crmSuggestions =
    remote?.q === customer && !exact
      ? remote.data.crm.filter((c) => !known.some((k) => k.name.toLowerCase() === c.name.toLowerCase())).slice(0, 5)
      : [];

  useEffect(() => {
    // The customer lookup is a partner permission; staff rely on the server's duplicate check at submit.
    if (customer.length < 3 || onBehalf) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      lookupCustomerAction({ q: customer })
        .then((result) => {
          if (!cancelled && result.ok) setRemote({ q: customer, data: result.data });
        })
        .catch(() => {
          if (!cancelled) setRemote(null);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customer, onBehalf]);

  // A draft is offered once, on arrival, and never when the partner came to register a customer again.
  useEffect(() => {
    const saved = source ? null : readDraft(userId);
    if (saved && hasContent(saved.form, blank)) setDraft(saved);
    setDraftChecked(true);
  }, [source, userId, blank]);

  // Saved a moment after the last keystroke; paused while the restore notice waits for an answer.
  useEffect(() => {
    if (!draftChecked || draft || submitted) return;
    const timer = setTimeout(() => writeDraft(userId, hasContent(form, baseline) ? serializeDraft(form, new Date()) : null), 400);
    return () => clearTimeout(timer);
  }, [form, baseline, draft, draftChecked, submitted, userId]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      if (!leaving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Next has no route-change blocker, so a click on any in-app link is held until the partner confirms.
  useEffect(() => {
    if (!dirty) return;
    const hold = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTo(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", hold, true);
    return () => document.removeEventListener("click", hold, true);
  }, [dirty]);

  const restoreDraft = (): void => {
    if (!draft) return;
    setForm(draft.form);
    setDraft(null);
  };
  const discardDraft = (): void => {
    writeDraft(userId, null);
    setDraft(null);
  };

  const hasSuggestions = suggestions.length > 0 || crmSuggestions.length > 0;
  const lookupDone = remote?.q === customer;

  const togglePicked = (product: Product): void =>
    patch({ picked: form.picked.includes(product) ? form.picked.filter((p) => p !== product) : [...form.picked, product] });

  const setContact = (key: string, change: Partial<{ name: string; role: string; email: string; phone: string }>): void =>
    patch({ contacts: form.contacts.map((c) => (c.key === key ? { ...c, ...change } : c)) });

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (Object.keys(live).length > 0) {
      setTried(true);
      setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (held.length > 0) {
      setFormError("Take the products you already registered for this customer out of your picks to continue.");
      return;
    }
    if (onBehalf && !partnerId) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await registerDealsAction({ ...toRegisterInput(form), ...(onBehalf ? { partnerId } : {}) });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    writeDraft(userId, null);
    setServerErrors({});
    setFormError(null);
    setSubmitted({ customer, deals: result.data.map((d) => ({ id: d.id, product: d.product, reference: d.reference })) });
    setTried(false);
    setTouched(new Set());
    toast(result.data.length > 1 ? `${result.data.length} registrations sent for approval` : "Submitted for approval");
  };

  const pickPartner = (id: string): void => {
    setPartnerId(id);
    const region = regionFor(onBehalf?.partners.find((p) => p.id === id)?.region);
    if (id) patch({ region, managerId: managerFor(managers, region) });
  };

  const registerAnother = (): void => {
    setPartnerId("");
    const next = blankForm(form.region, form.managerId);
    setBaseline(next);
    setForm(next);
    setSubmitted(null);
  };

  const leave = (): void => {
    if (!leaveTo) return;
    leaving.current = true;
    router.push(leaveTo);
  };

  const errorId = (key: string): string => `err-${key.replace(/\./g, "-")}`;
  const inputProps = (key: string): { "aria-invalid"?: true; "aria-describedby"?: string; onBlur: () => void } => ({
    ...(fieldError(key) ? { "aria-invalid": true as const, "aria-describedby": errorId(key) } : {}),
    onBlur: () => touch(key),
  });
  const errorLine = (key: string): React.JSX.Element | null => {
    const message = fieldError(key);
    return message ? (
      <span className="err" id={errorId(key)}>
        {message}
      </span>
    ) : null;
  };
  const cls = (key: string, extra = ""): string => `field${extra ? ` ${extra}` : ""}${fieldError(key) ? " field-err" : ""}`;
  const contactsError = fieldError("contacts");

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">{onBehalf ? "Register deal for a partner" : "Register deal"}</h1>
          <span className="h1-sub">
            {onBehalf
              ? "Recorded in the audit log as registered on the partner's behalf. The partner gets no receipt email."
              : "One registration per product. Protection starts when CleanStart accepts it."}
          </span>
        </div>
      </div>

      <div className="row">
        <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {submitted ? (
            <section
              className="card card-b"
              aria-live="polite"
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 16 }}
            >
              <span className="li-ic tone-green" style={{ width: 32, height: 32 }}>
                <Icon name="check" />
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                  {submitted.deals.length > 1 ? `${submitted.deals.length} registrations sent for approval` : "Submitted for approval"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#5E5B6E" }}>
                  {submitted.customer}, for {partnerName}. {submitted.deals.length > 1 ? "Each one is" : "It is"} pending until CleanStart reviews
                  it.{" "}
                  {onBehalf ? "The partner's team is told about each decision." : "You get an email for every decision."}
                </p>
                <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none", fontSize: 13, display: "flex", flexDirection: "column", gap: 2 }}>
                  {submitted.deals.map((deal) => (
                    <li key={deal.id}>
                      <span className="tnum" style={{ fontWeight: 600 }}>
                        {deal.reference}
                      </span>{" "}
                      <Link href={dealHref(deal.id)}>Open the {PRODUCT_LABEL[deal.product]} deal</Link>
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Link href={listHref} className="btn btn-p">
                    View deals
                  </Link>
                  <button type="button" className="btn btn-s" onClick={registerAnother}>
                    Register another
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              {draft ? (
                <div className="note note-violet" role="status" style={{ alignItems: "center" }}>
                  <Icon name="info" />
                  <span style={{ flex: 1 }}>
                    <b>You have an unsent draft</b> from {fmtLong(draft.savedAt.slice(0, 10))}
                    {draft.form.customer.trim() ? `, for ${draft.form.customer.trim()}` : ""}.
                  </span>
                  <button type="button" className="btn btn-p" onClick={restoreDraft}>
                    Restore draft
                  </button>
                  <button type="button" className="btn btn-s" onClick={discardDraft}>
                    Discard
                  </button>
                </div>
              ) : null}
              {source && baseline.customer === source.customer ? (
                <div className="note note-violet" role="status">
                  <Icon name="info" />
                  <span>
                    <b>Registering {source.customer} again.</b> The customer, country and contacts come from your earlier registration. Pick the
                    products and fill in the new opportunity.
                  </span>
                </div>
              ) : null}
              <form onSubmit={submit} className="card" noValidate>
                {onBehalf ? (
                  <>
                    <fieldset style={SECTION_STYLE}>
                      <legend className="sr">Partner</legend>
                      <div className="sec-h">
                        <h2 className="sec-t">Partner</h2>
                        <span className="sec-s">Who this registration is for</span>
                      </div>
                      <PartnerPicker
                        partners={onBehalf.partners}
                        value={partnerId}
                        onChange={pickPartner}
                        error={tried && !partnerId ? "Pick the partner." : undefined}
                      />
                    </fieldset>
                    <hr className="hr" />
                  </>
                ) : null}
                <fieldset style={SECTION_STYLE}>
                  <legend className="sr">Customer and contacts</legend>
                  <div className="sec-h">
                    <h2 className="sec-t">1. Customer and contacts</h2>
                    <span className="sec-s">The company and the people we can reach there</span>
                  </div>
                  <div style={COLUMN_STYLE}>
                    <div className="grid2">
                      <div className="fg" style={{ position: "relative" }}>
                        <label htmlFor="customer" className="lbl">
                          Company name
                        </label>
                        <input
                          id="customer"
                          autoComplete="off"
                          aria-autocomplete="list"
                          aria-controls={hasSuggestions ? "cust-sugg" : undefined}
                          className={cls("customer")}
                          type="text"
                          value={form.customer}
                          onChange={(e) => patch({ customer: e.target.value })}
                          placeholder="For example, Vardhan Capital"
                          {...inputProps("customer")}
                        />
                        {errorLine("customer")}
                      {hasSuggestions ? (
                        // biome-ignore lint/a11y/useFocusableInteractive: the options are buttons and focusable; the list itself is not a tab stop
                        <div className="sugg" id="cust-sugg" role="listbox" aria-label="Your existing customers">
                          {suggestions.length > 0 ? <div className="sugg-h">Your customers</div> : null}
                          {suggestions.map((c) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              className="dd-opt"
                              key={c.name}
                              onClick={() => patch({ customer: c.name, site: c.site })}
                              style={{ height: "auto", padding: "6px 8px" }}
                            >
                              <span className="li-t">
                                <span className="li-n">{c.name}</span>
                                <span className="li-s">
                                  {c.site}, {c.count} {c.count === 1 ? "deal" : "deals"} with you
                                </span>
                              </span>
                            </button>
                          ))}
                          {crmSuggestions.length > 0 ? <div className="sugg-h">Known to CleanStart</div> : null}
                          {crmSuggestions.map((c) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              className="dd-opt"
                              key={c.name}
                              onClick={() => patch({ customer: c.name, site: c.website ?? "" })}
                              style={{ height: "auto", padding: "6px 8px" }}
                            >
                              <span className="li-t">
                                <span className="li-n">{c.name}</span>
                                <span className="li-s">{c.website ?? "No website on record"}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                      <div className="fg">
                        <label htmlFor="site" className="lbl">
                          Website <span className="hint">(optional, helps match the account)</span>
                        </label>
                        <input
                          id="site"
                          className={cls("website")}
                          type="text"
                          inputMode="url"
                          value={form.site}
                          onChange={(e) => patch({ site: e.target.value })}
                          placeholder="vardhancapital.in"
                          {...inputProps("website")}
                        />
                        {errorLine("website")}
                      </div>
                    </div>
                    <div className="grid2">
                      <div className="fg">
                        <label htmlFor="country" className="lbl">
                          Customer country <span className="hint">(optional, start typing to search)</span>
                        </label>
                        <Combobox
                          id="country"
                          value={form.country}
                          options={COUNTRIES.map((c) => c.name)}
                          placeholder="India"
                          onChange={(v) => patch({ country: v })}
                          onBlur={() => {
                            touch("customerCountry");
                            const match = findCountry(form.country);
                            if (match && match.name !== form.country) patch({ country: match.name });
                          }}
                          invalid={Boolean(fieldError("customerCountry"))}
                          ariaDescribedBy={fieldError("customerCountry") ? errorId("customerCountry") : undefined}
                        />
                        {errorLine("customerCountry")}
                      </div>
                      <div className="fg">
                        <label htmlFor="industry" className="lbl">
                          Industry <span className="hint">(optional)</span>
                        </label>
                        <Dropdown
                          id="industry"
                          variant="field"
                          value={form.industry}
                          options={[
                            { value: "", label: "Not sure or not listed" },
                            ...(form.industry && !(INDUSTRIES as readonly string[]).includes(form.industry) ? [{ value: form.industry, label: form.industry }] : []),
                            ...INDUSTRIES.map((name) => ({ value: name, label: name })),
                          ]}
                          onChange={(v) => patch({ industry: v })}
                        />
                      </div>
                    </div>

                    <div className="fg" role="group" aria-labelledby="contacts-label">
                      <span id="contacts-label" className="lbl">
                        Contacts{" "}
                        <span className="hint">(at least one with an email or phone; the first is the primary contact)</span>
                      </span>
                      {form.contacts.map((c, i) => (
                        <div
                          key={c.key}
                          style={{ border: "1px solid #ECEBF1", borderRadius: 8, padding: "10px 10px 12px", display: "flex", flexDirection: "column", gap: 8 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span className="hint" style={{ fontWeight: 600 }}>
                              {i === 0 ? "Primary contact" : `Contact ${i + 1}`}
                            </span>
                            {form.contacts.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-g"
                                onClick={() => patch({ contacts: form.contacts.filter((x) => x.key !== c.key) })}
                                aria-label={`Remove contact ${i + 1}`}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                          <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                            <div className="fg">
                              <label htmlFor={`cname-${i}`} className="lbl">
                                Name
                              </label>
                              <input
                                id={`cname-${i}`}
                                className={cls(`contacts.${i}.name`)}
                                type="text"
                                autoComplete="off"
                                value={c.name}
                                onChange={(e) => setContact(c.key, { name: e.target.value })}
                                {...inputProps(`contacts.${i}.name`)}
                              />
                              {errorLine(`contacts.${i}.name`)}
                            </div>
                            <div className="fg">
                              <label htmlFor={`crole-${i}`} className="lbl">
                                Role <span className="hint">(for example CISO)</span>
                              </label>
                              <input
                                id={`crole-${i}`}
                                className="field"
                                type="text"
                                maxLength={120}
                                value={c.role}
                                onChange={(e) => setContact(c.key, { role: e.target.value })}
                              />
                            </div>
                            <div className="fg">
                              <label htmlFor={`cemail-${i}`} className="lbl">
                                Email
                              </label>
                              <input
                                id={`cemail-${i}`}
                                className={cls(`contacts.${i}.email`)}
                                type="email"
                                autoComplete="off"
                                value={c.email}
                                onChange={(e) => setContact(c.key, { email: e.target.value })}
                                {...inputProps(`contacts.${i}.email`)}
                              />
                              {errorLine(`contacts.${i}.email`)}
                            </div>
                            <div className="fg">
                              <label htmlFor={`cphone-${i}`} className="lbl">
                                Phone
                              </label>
                              <input
                                id={`cphone-${i}`}
                                className={cls(`contacts.${i}.phone`, "tnum")}
                                type="tel"
                                autoComplete="off"
                                value={c.phone}
                                onChange={(e) => setContact(c.key, { phone: e.target.value })}
                                {...inputProps(`contacts.${i}.phone`)}
                              />
                              {errorLine(`contacts.${i}.phone`)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {contactsError ? (
                        <span className="err" role="alert">
                          {contactsError}
                        </span>
                      ) : null}
                      {form.contacts.length < MAX_CONTACTS ? (
                        <button
                          type="button"
                          className="btn btn-s"
                          style={{ alignSelf: "flex-start" }}
                          onClick={() => patch({ contacts: [...form.contacts, newContact()] })}
                        >
                          Add another contact
                        </button>
                      ) : null}
                    </div>
                  </div>
                </fieldset>
                <hr className="hr" />
                <fieldset style={SECTION_STYLE}>
                  <legend className="sr">Opportunity</legend>
                  <div className="sec-h">
                    <h2 className="sec-t">2. Opportunity</h2>
                    <span className="sec-s">What they are buying and when</span>
                  </div>
                  <div style={COLUMN_STYLE}>
                    <div className="fg">
                      <span id="plabel" className="lbl">
                        Products <span className="hint">(pick one or more; each becomes its own registration)</span>
                      </span>
                      <div role="group" aria-labelledby="plabel" className="grid3">
                        {PRODUCTS.map((product) => {
                          const on = form.picked.includes(product);
                          return (
                            <button
                              type="button"
                              key={product}
                              className={`opt${on ? " opt-on" : ""}`}
                              aria-pressed={on}
                              onClick={() => togglePicked(product)}
                            >
                              <ProductMark product={product} large />
                              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{PRODUCT_LABEL[product]}</span>
                                <span style={{ fontSize: 11.5, color: "#6B687D" }}>{PRODUCT_DESC[product]}</span>
                              </span>
                              <span className="chk">
                                <Icon name="check" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {tried && live.products ? (
                        <span className="err" role="alert">
                          {live.products}
                        </span>
                      ) : (
                        errorLine("products")
                      )}
                    </div>
                    {held.map(({ deal }) => (
                      <div className="note note-amber" role="status" key={deal.id}>
                        <Icon name="warn" />
                        <span>
                          <b>Already registered.</b>{" "}
                          {deal.status === "accepted" && deal.protectionEnd
                            ? `Your company holds an accepted ${PRODUCT_LABEL[deal.product]} deal at ${deal.customer}, protected until ${fmtLong(deal.protectionEnd)}.`
                            : `Your company already has ${PRODUCT_LABEL[deal.product]} at ${deal.customer} waiting for review.`}{" "}
                          Take it out of your picks to continue.
                        </span>
                      </div>
                    ))}
                    <div className="grid3">
                      <div className="fg">
                        <label htmlFor="value" className="lbl">
                          Deal value <span className="hint">(optional, your best estimate)</span>
                        </label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <div style={{ width: 84, flex: "none" }}>
                            <Dropdown ariaLabel="Currency" variant="field" value={form.currency} options={DEAL_CURRENCIES} onChange={(v) => patch({ currency: v as DealCurrency })} />
                          </div>
                          <input
                            id="value"
                            className={cls("dealValue", "tnum")}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={form.dealValue}
                            onChange={(e) => patch({ dealValue: e.target.value })}
                            placeholder="125000"
                            {...inputProps("dealValue")}
                          />
                        </div>
                        {errorLine("dealValue")}
                      </div>
                      <div className="fg">
                        <label htmlFor="stage" className="lbl">
                          Sales stage <span className="hint">(optional)</span>
                        </label>
                        <Dropdown
                          id="stage"
                          variant="field"
                          value={form.salesStage}
                          options={[{ value: "", label: "Not set" }, ...SALES_STAGES.map((stage) => ({ value: stage, label: stage }))]}
                          onChange={(v) => patch({ salesStage: v })}
                        />
                      </div>
                      <div className="fg">
                        <label htmlFor="seats" className="lbl">
                          Seats or volume <span className="hint">(optional)</span>
                        </label>
                        <input
                          id="seats"
                          className={cls("seats", "tnum")}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={form.seats}
                          onChange={(e) => patch({ seats: e.target.value })}
                          placeholder="For example 250 users"
                          {...inputProps("seats")}
                        />
                        {errorLine("seats")}
                      </div>
                    </div>
                    <div className="grid3">
                      <div className="fg">
                        <label htmlFor="close" className="lbl">
                          Expected close <span className="hint">(optional)</span>
                        </label>
                        <DatePicker
                          id="close"
                          min={today}
                          value={form.close}
                          onChange={(v) => patch({ close: v })}
                          invalid={Boolean(fieldError("expectedClose"))}
                          ariaDescribedBy={fieldError("expectedClose") ? errorId("expectedClose") : undefined}
                        />
                        {errorLine("expectedClose")}
                      </div>
                      <div className="fg">
                        <label htmlFor="decision" className="lbl">
                          Decision date <span className="hint">(optional, vendor decision)</span>
                        </label>
                        <DatePicker
                          id="decision"
                          value={form.decisionDate}
                          onChange={(v) => patch({ decisionDate: v })}
                          invalid={Boolean(fieldError("decisionDate"))}
                          ariaDescribedBy={fieldError("decisionDate") ? errorId("decisionDate") : undefined}
                        />
                        {errorLine("decisionDate")}
                      </div>
                      <div className="fg">
                        <label htmlFor="competitor" className="lbl">
                          Competing product <span className="hint">(optional)</span>
                        </label>
                        <input
                          id="competitor"
                          className="field"
                          type="text"
                          maxLength={200}
                          value={form.competitor}
                          onChange={(e) => patch({ competitor: e.target.value })}
                          placeholder="Who else is in the deal"
                        />
                      </div>
                    </div>
                    <div className="fg">
                      <label htmlFor="usecase" className="lbl">
                        Use case <span className="hint">(optional, what problem they want solved)</span>
                      </label>
                      <textarea
                        id="usecase"
                        className="field"
                        rows={2}
                        maxLength={1000}
                        value={form.useCase}
                        onChange={(e) => patch({ useCase: e.target.value })}
                        style={{ height: "auto", padding: "7px 10px" }}
                      />
                    </div>
                    <div className="grid2">
                      <div className="fg">
                        <span id="rlabel" className="lbl">
                          Region <span className="hint">(which CleanStart team reviews it)</span>
                        </span>
                        <div className="seg" role="group" aria-labelledby="rlabel" style={{ alignSelf: "flex-start" }}>
                          {offer(form.region).map(({ key: region, name: regionLabel }) => (
                            <button
                              type="button"
                              key={region}
                              className={`seg-b${form.region === region ? " seg-on" : ""}`}
                              aria-pressed={form.region === region}
                              onClick={() => patch({ region, managerId: managerFor(managers, region) })}
                            >
                              {regionLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="fg">
                        <label htmlFor="am" className="lbl">
                          Partner manager <span className="hint">(reviews this registration)</span>
                        </label>
                        <Dropdown
                          id="am"
                          variant="field"
                          value={form.managerId}
                          options={managers.map((m) => ({ value: m.id, label: m.name }))}
                          onChange={(managerId) => patch({ managerId })}
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>
                <hr className="hr" />
                <fieldset style={SECTION_STYLE}>
                  <legend className="sr">Notes and consent</legend>
                  <div className="sec-h">
                    <h2 className="sec-t">3. Notes and consent</h2>
                    <span className="sec-s">Anything else the reviewer should know</span>
                  </div>
                  <div style={COLUMN_STYLE}>
                    <div className="fg">
                      <label htmlFor="details" className="lbl">
                        Additional information <span className="hint">(optional)</span>
                      </label>
                      <textarea
                        id="details"
                        className="field"
                        rows={3}
                        maxLength={2000}
                        value={form.details}
                        onChange={(e) => patch({ details: e.target.value })}
                        style={{ height: "auto", padding: "7px 10px" }}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="consent" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, cursor: "pointer" }}>
                        <input
                          id="consent"
                          type="checkbox"
                          checked={form.consent}
                          onChange={(e) => patch({ consent: e.target.checked })}
                          style={{ marginTop: 3 }}
                          {...inputProps("consent")}
                        />
                        <span>I confirm that this information is accurate and that the customer is aware of this registration.</span>
                      </label>
                      {errorLine("consent")}
                    </div>
                  </div>
                </fieldset>
                {formError ? (
                  <div className="note note-amber" role="alert" style={{ margin: "0 14px 10px" }}>
                    <Icon name="warn" />
                    <span>{formError}</span>
                  </div>
                ) : null}
                <div
                  className="stick-b"
                  style={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: 5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: "10px 14px",
                    borderTop: "1px solid #F0EFF4",
                    background: "#FCFCFD",
                    borderRadius: "0 0 10px 10px",
                  }}
                >
                  <span className="hint">
                    CleanStart reviews it within {REVIEW_SLA_BUSINESS_DAYS} business days. Accepted deals are protected for {PROTECTION_WINDOW_DAYS} days.
                  </span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <Link href={listHref} className="btn btn-s">
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-p" disabled={busy}>
                      Submit for approval
                    </button>
                  </span>
                </div>
              </form>
            </>
          )}
        </div>

        <aside style={{ flex: "0 1 300px", minWidth: 260, display: "flex", flexDirection: "column", gap: 12 }}>
          {exact ? (
            <section aria-labelledby="existing" className="card clip">
              <div className="card-h">
                <h2 id="existing" className="card-t">
                  Your deals at this customer
                </h2>
                <span className="card-meta">{exactDeals.length}</span>
              </div>
              {exactDeals.map((d) => (
                <div className="li" key={d.id}>
                  <ProductMark product={d.product} />
                  <span className="li-t">
                    <span className="li-n">{PRODUCT_LABEL[d.product]}</span>
                    <span className="li-s">{dealMeta(d, today)}</span>
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </section>
          ) : (
            <section aria-labelledby="dup" className="card clip">
              <div className="card-h">
                <h2 id="dup" className="card-t">
                  {customer.length >= 3 && !hasSuggestions && lookupDone ? "New customer for you" : "Duplicate check"}
                </h2>
              </div>
              <div className="card-b" style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
                {onBehalf
                  ? "CleanStart checks this partner's open registrations when you submit."
                  : customer.length < 3
                  ? "Type the company name to check for existing registrations."
                  : hasSuggestions
                    ? "Pick a match from the list to see your deals at that customer."
                    : lookupDone
                      ? `${partnerName} has no registrations for this customer yet. CleanStart still checks other partners when it reviews.`
                      : "Checking for existing registrations."}
              </div>
            </section>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={leaveTo !== null}
        onClose={() => setLeaveTo(null)}
        onConfirm={leave}
        title="Leave this form?"
        body="Your draft is saved on this device. You can restore it the next time you open Register deal."
        confirmLabel="Leave"
      />
    </div>
  );
}
