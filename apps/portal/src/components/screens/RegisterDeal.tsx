"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DEAL_REGIONS, type DealRegion, PARTNER_REGION_LABEL, PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";
import type { CustomerSuggestionDto, ManagerOptionDto, RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { lookupCustomerAction, registerDealsAction } from "@/server/actions/registrations";
import { issuesToErrors } from "@/server/actions/result";
import { fmtLong, fmtShort } from "../deals/dates";
import { managerFor, protectionView, reviewSince, sameCustomer } from "../deals/derive";
import { ProductMark, StatusBadge } from "../deals/parts";
import type { CustomerLookupResult } from "../deals/types";
import { Icon } from "../icon";
import { Dropdown } from "../ui/dropdown";
import { useToast } from "../ui/toast";

const PRODUCT_DESC: Record<Product, string> = {
  images: "Zero-CVE hardened images",
  libraries: "Verified dependencies",
  cleansight: "Vulnerability detection",
};

interface FormState {
  customer: string;
  site: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  picked: Product[];
  region: DealRegion;
  managerId: string;
  close: string;
  details: string;
}

const BLANK: FormState = {
  customer: "",
  site: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  picked: [],
  region: "india",
  managerId: "",
  close: "",
  details: "",
};

const EMPTY_OWN: CustomerSuggestionDto[] = [];

interface Submitted {
  customer: string;
  products: Product[];
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
  today: string;
}

export function RegisterDeal({ mine, managers, partnerName, today }: RegisterDealProps): React.JSX.Element {
  const toast = useToast();
  const [form, setForm] = useState<FormState>({ ...BLANK, managerId: managerFor(managers, "india") });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [remote, setRemote] = useState<{ q: string; data: CustomerLookupResult } | null>(null);

  const patch = (change: Partial<FormState>): void => setForm((prev) => ({ ...prev, ...change }));
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
    if (customer.length < 3) {
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
  }, [customer]);

  const customerErr = tried && !customer;
  const productErr = tried && form.picked.length === 0;

  const togglePicked = (product: Product): void =>
    patch({ picked: form.picked.includes(product) ? form.picked.filter((p) => p !== product) : [...form.picked, product] });

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!customer || form.picked.length === 0) {
      setTried(true);
      return;
    }
    if (held.length > 0) {
      setFormError("Take the products you already registered for this customer out of your picks to continue.");
      return;
    }
    setBusy(true);
    const result = await registerDealsAction({
      customer,
      website: form.site,
      products: form.picked,
      region: form.region,
      managerId: form.managerId || null,
      contact: form.contactName.trim()
        ? { name: form.contactName, role: null, email: form.contactEmail, phone: form.contactPhone }
        : null,
      expectedClose: form.close,
      notes: form.details,
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitted({ customer, products: result.data.map((d) => d.product) });
    setTried(false);
    toast(result.data.length > 1 ? `${result.data.length} registrations sent for approval` : "Submitted for approval");
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Register deal</h1>
          <span className="h1-sub">One registration per product. Protection starts when CleanStart accepts it.</span>
        </div>
      </div>

      <div className="row">
        <div style={{ flex: "1 1 620px", minWidth: 0 }}>
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
                  {submitted.products.length > 1
                    ? `${submitted.products.length} registrations sent for approval`
                    : "Submitted for approval"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#5E5B6E" }}>
                  {submitted.customer}: {submitted.products.map((p) => PRODUCT_LABEL[p]).join(", ")}.{" "}
                  {submitted.products.length > 1 ? "Each one is" : "It is"} pending until CleanStart reviews it. You get
                  an email for every decision.
                </p>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Link href={ROUTES.partner.deals} className="btn btn-p">
                    View deals
                  </Link>
                  <button
                    type="button"
                    className="btn btn-s"
                    onClick={() => {
                      setForm(BLANK);
                      setSubmitted(null);
                    }}
                  >
                    Register another
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <form onSubmit={submit} className="card" noValidate>
              <fieldset style={{ border: 0, margin: 0, padding: "14px 14px 16px" }}>
                <legend className="sr">Customer</legend>
                <div className="sec-h">
                  <h2 className="sec-t">Customer</h2>
                  <span className="sec-s">The company and your contact there</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="grid2">
                    <div className="fg" style={{ position: "relative" }}>
                      <label htmlFor="customer" className="lbl">
                        Company name
                      </label>
                      <input
                        id="customer"
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-controls="cust-sugg"
                        className={`field${customerErr ? " field-err" : ""}`}
                        type="text"
                        value={form.customer}
                        onChange={(e) => patch({ customer: e.target.value })}
                        aria-invalid={customerErr || undefined}
                        aria-describedby={customerErr ? "customer-err" : undefined}
                        placeholder="For example, Vardhan Capital"
                      />
                      {customerErr ? (
                        <span className="err" id="customer-err">
                          Enter the customer's company name.
                        </span>
                      ) : null}
                      {suggestions.length > 0 || crmSuggestions.length > 0 ? (
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
                        className={`field${errors.website ? " field-err" : ""}`}
                        type="text"
                        value={form.site}
                        onChange={(e) => patch({ site: e.target.value })}
                        aria-invalid={errors.website ? true : undefined}
                        aria-describedby={errors.website ? "site-err" : undefined}
                      />
                      {errors.website ? (
                        <span className="err" id="site-err">
                          {errors.website}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid3">
                    <div className="fg">
                      <label htmlFor="contact" className="lbl">
                        Contact name
                      </label>
                      <input
                        id="contact"
                        className="field"
                        type="text"
                        value={form.contactName}
                        onChange={(e) => patch({ contactName: e.target.value })}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="cemail" className="lbl">
                        Contact email
                      </label>
                      <input
                        id="cemail"
                        className={`field${errors["contact.email"] ? " field-err" : ""}`}
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                        aria-invalid={errors["contact.email"] ? true : undefined}
                        aria-describedby={errors["contact.email"] ? "cemail-err" : undefined}
                      />
                      {errors["contact.email"] ? (
                        <span className="err" id="cemail-err">
                          {errors["contact.email"]}
                        </span>
                      ) : null}
                    </div>
                    <div className="fg">
                      <label htmlFor="cphone" className="lbl">
                        Contact phone
                      </label>
                      <input
                        id="cphone"
                        className="field tnum"
                        type="tel"
                        value={form.contactPhone}
                        onChange={(e) => patch({ contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
              <hr className="hr" />
              <fieldset style={{ border: 0, margin: 0, padding: "14px 14px 16px" }}>
                <legend className="sr">Opportunity</legend>
                <div className="sec-h">
                  <h2 className="sec-t">Opportunity</h2>
                  <span className="sec-s">What they are buying</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                    {productErr ? (
                      <span className="err" role="alert">
                        Pick at least one product.
                      </span>
                    ) : null}
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
                      <span id="rlabel" className="lbl">
                        Region
                      </span>
                      <div className="seg" role="group" aria-labelledby="rlabel" style={{ alignSelf: "flex-start" }}>
                        {DEAL_REGIONS.map((region) => (
                          <button
                            type="button"
                            key={region}
                            className={`seg-b${form.region === region ? " seg-on" : ""}`}
                            aria-pressed={form.region === region}
                            onClick={() => patch({ region, managerId: managerFor(managers, region) })}
                          >
                            {PARTNER_REGION_LABEL[region]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="fg">
                      <label htmlFor="am" className="lbl">
                        Account manager
                      </label>
                      <Dropdown
                        id="am"
                        variant="field"
                        value={form.managerId}
                        options={managers.map((m) => ({ value: m.id, label: m.name }))}
                        onChange={(managerId) => patch({ managerId })}
                      />
                    </div>
                    <div className="fg">
                      <label htmlFor="close" className="lbl">
                        Expected close <span className="hint">(optional)</span>
                      </label>
                      <input
                        id="close"
                        className="field"
                        type="text"
                        value={form.close}
                        onChange={(e) => patch({ close: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
              <hr className="hr" />
              <fieldset style={{ border: 0, margin: 0, padding: "14px 14px 16px" }}>
                <legend className="sr">Additional information</legend>
                <div className="sec-h">
                  <h2 className="sec-t">Additional information</h2>
                  <span className="sec-s">Optional</span>
                </div>
                <label htmlFor="details" className="sr">
                  Additional information
                </label>
                <textarea
                  id="details"
                  className="field"
                  rows={3}
                  value={form.details}
                  onChange={(e) => patch({ details: e.target.value })}
                />
              </fieldset>
              {formError ? (
                <div className="note note-amber" role="alert" style={{ margin: "0 14px 10px" }}>
                  <Icon name="warn" />
                  <span>{formError}</span>
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderTop: "1px solid #F0EFF4",
                  background: "#FCFCFD",
                  borderRadius: "0 0 10px 10px",
                }}
              >
                <span className="hint">
                  CleanStart reviews it within 2 business days. Accepted deals are protected for 90 days.
                </span>
                <span style={{ display: "flex", gap: 6 }}>
                  <Link href={ROUTES.partner.deals} className="btn btn-s">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-p" disabled={busy}>
                    Submit for approval
                  </button>
                </span>
              </div>
            </form>
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
            <section aria-labelledby="newc" className="card clip">
              <div className="card-h">
                <h2 id="newc" className="card-t">
                  New customer for you
                </h2>
              </div>
              <div className="card-b" style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
                {partnerName} has no registrations at {customer || "this customer"} yet. CleanStart still checks other
                partners when it reviews.
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
