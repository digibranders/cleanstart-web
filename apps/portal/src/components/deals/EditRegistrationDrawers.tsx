"use client";

import { useState } from "react";
import { DEAL_CURRENCIES, type DealCurrency, PRODUCT_LABEL } from "@/lib/domain";
import type { RegistrationContactDto, RegistrationDetailDto } from "@/lib/dto";
import {
  COUNTRIES,
  contactErrors,
  findCountry,
  INDUSTRIES,
  newContact,
  parseAmount,
  SALES_STAGES,
  validateDealForm,
  blankForm,
} from "@/lib/deal-form";
import {
  addRegistrationContactAction,
  editRegistrationAction,
  removeRegistrationContactAction,
  updateRegistrationContactAction,
} from "@/server/actions/registration-edit";
import { Dialog, Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const FIELD_KEYS = ["customer", "website", "customerCountry", "dealValue", "seats", "expectedClose", "decisionDate"] as const;

/** Edit a pending registration. Same fields, limits and messages as the register form. */
export function EditRegistrationDrawer({
  deal,
  today,
  onClose,
}: {
  deal: RegistrationDetailDto;
  today: string;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const initialClose = deal.expectedClose && ISO.test(deal.expectedClose) ? deal.expectedClose : "";
  const [f, setF] = useState({
    customer: deal.customer,
    site: deal.website ?? "",
    country: deal.customerCountry ? (findCountry(deal.customerCountry)?.name ?? deal.customerCountry) : "",
    industry: deal.customerIndustry ?? "",
    dealValue: deal.dealValue === null ? "" : String(deal.dealValue),
    currency: deal.currency as DealCurrency,
    salesStage: deal.salesStage ?? "",
    seats: deal.seats === null ? "" : String(deal.seats),
    close: initialClose,
    decisionDate: deal.decisionDate ?? "",
    competitor: deal.competitor ?? "",
    useCase: deal.useCase ?? "",
    notes: deal.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (over: Partial<typeof f>): void => setF((prev) => ({ ...prev, ...over }));

  const err = (key: string): React.JSX.Element | null =>
    errors[key] ? (
      <span className="err" id={`ed-${key}-err`}>
        {errors[key]}
      </span>
    ) : null;
  const bad = (key: string): { className: string; "aria-invalid"?: true; "aria-describedby"?: string } => ({
    className: `field${errors[key] ? " field-err" : ""}`,
    ...(errors[key] ? { "aria-invalid": true as const, "aria-describedby": `ed-${key}-err` } : {}),
  });

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const check = validateDealForm(
      {
        ...blankForm(deal.region, deal.managerId ?? ""),
        customer: f.customer,
        site: f.site,
        country: f.country,
        picked: [deal.product],
        contacts: deal.contacts.map((c) => newContact({ name: c.name, email: c.email ?? "", phone: c.phone ?? "" })),
        dealValue: f.dealValue,
        seats: f.seats,
        close: f.close,
        decisionDate: f.decisionDate,
        consent: true,
      },
      today,
    );
    const found: Record<string, string> = {};
    for (const key of FIELD_KEYS) {
      if (key === "expectedClose" && f.close === initialClose) continue;
      if (check[key]) found[key] = check[key];
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setFormError(null);
    const country = findCountry(f.country);
    const result = await editRegistrationAction({
      id: deal.id,
      fields: {
        customer: f.customer,
        website: f.site,
        customerCountry: country ? country.code : f.country.trim() === "" ? null : deal.customerCountry,
        customerIndustry: f.industry,
        dealValue: f.dealValue.trim() ? parseAmount(f.dealValue) : null,
        currency: f.currency,
        salesStage: f.salesStage,
        seats: f.seats.trim() ? Number(f.seats) : null,
        ...(f.close === initialClose ? {} : { expectedClose: f.close }),
        decisionDate: f.decisionDate,
        competitor: f.competitor,
        useCase: f.useCase,
        notes: f.notes,
      },
    });
    setBusy(false);
    if (!result.ok) {
      const issues = (result.error as { issues?: Array<{ path: string; message: string }> }).issues;
      if (issues?.length) setErrors(Object.fromEntries(issues.map((i) => [i.path, i.message])));
      setFormError(result.error.message);
      return;
    }
    toast("Registration updated. Your partner manager sees the changes.");
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Edit registration"
      subtitle={`${deal.customer}, ${PRODUCT_LABEL[deal.product]}. You can change this until CleanStart accepts it.`}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Save changes
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="ed-customer" className="lbl">
          Customer
        </label>
        <input id="ed-customer" type="text" maxLength={200} value={f.customer} onChange={(e) => set({ customer: e.target.value })} {...bad("customer")} />
        {err("customer")}
      </div>
      <div className="fg">
        <label htmlFor="ed-website" className="lbl">
          Website <span className="hint">(optional)</span>
        </label>
        <input id="ed-website" type="text" inputMode="url" value={f.site} onChange={(e) => set({ site: e.target.value })} placeholder="vardhancapital.in" {...bad("website")} />
        {err("website")}
      </div>
      <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="fg">
          <label htmlFor="ed-country" className="lbl">
            Customer country
          </label>
          <input
            id="ed-country"
            type="text"
            list="ed-countries"
            autoComplete="off"
            value={f.country}
            onChange={(e) => set({ country: e.target.value })}
            onBlur={() => {
              const match = findCountry(f.country);
              if (match && match.name !== f.country) set({ country: match.name });
            }}
            {...bad("customerCountry")}
          />
          <datalist id="ed-countries">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name} />
            ))}
          </datalist>
          {err("customerCountry")}
        </div>
        <div className="fg">
          <label htmlFor="ed-industry" className="lbl">
            Industry
          </label>
          <select id="ed-industry" className="field" value={f.industry} onChange={(e) => set({ industry: e.target.value })}>
            <option value="">Not sure or not listed</option>
            {f.industry && !(INDUSTRIES as readonly string[]).includes(f.industry) ? <option value={f.industry}>{f.industry}</option> : null}
            {INDUSTRIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="fg">
          <label htmlFor="ed-value" className="lbl">
            Deal value
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <select aria-label="Currency" className="field" style={{ width: 96, flex: "none" }} value={f.currency} onChange={(e) => set({ currency: e.target.value as DealCurrency })}>
              {DEAL_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input id="ed-value" type="text" inputMode="decimal" autoComplete="off" value={f.dealValue} onChange={(e) => set({ dealValue: e.target.value })} {...bad("dealValue")} />
          </div>
          {err("dealValue")}
        </div>
        <div className="fg">
          <label htmlFor="ed-stage" className="lbl">
            Sales stage
          </label>
          <select id="ed-stage" className="field" value={f.salesStage} onChange={(e) => set({ salesStage: e.target.value })}>
            <option value="">Not set</option>
            {SALES_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label htmlFor="ed-seats" className="lbl">
            Seats or volume
          </label>
          <input id="ed-seats" type="text" inputMode="numeric" autoComplete="off" value={f.seats} onChange={(e) => set({ seats: e.target.value })} {...bad("seats")} />
          {err("seats")}
        </div>
      </div>
      <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="fg">
          <label htmlFor="ed-close" className="lbl">
            Expected close
          </label>
          <input id="ed-close" type="date" min={today} value={f.close} onChange={(e) => set({ close: e.target.value })} {...bad("expectedClose")} />
          {err("expectedClose")}
        </div>
        <div className="fg">
          <label htmlFor="ed-decision" className="lbl">
            Decision date
          </label>
          <input id="ed-decision" type="date" value={f.decisionDate} onChange={(e) => set({ decisionDate: e.target.value })} {...bad("decisionDate")} />
          {err("decisionDate")}
        </div>
      </div>
      <div className="fg">
        <label htmlFor="ed-competitor" className="lbl">
          Competing product
        </label>
        <input id="ed-competitor" className="field" type="text" maxLength={200} value={f.competitor} onChange={(e) => set({ competitor: e.target.value })} />
      </div>
      <div className="fg">
        <label htmlFor="ed-usecase" className="lbl">
          Use case
        </label>
        <textarea id="ed-usecase" className="field" rows={2} maxLength={1000} value={f.useCase} onChange={(e) => set({ useCase: e.target.value })} style={{ height: "auto", padding: "7px 10px" }} />
      </div>
      <div className="fg">
        <label htmlFor="ed-notes" className="lbl">
          Additional information
        </label>
        <textarea id="ed-notes" className="field" rows={3} maxLength={2000} value={f.notes} onChange={(e) => set({ notes: e.target.value })} style={{ height: "auto", padding: "7px 10px" }} />
      </div>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
    </Drawer>
  );
}

/** Add one contact (contact is null) or edit one. */
export function ContactDrawer({
  deal,
  contact,
  onClose,
}: {
  deal: RegistrationDetailDto;
  contact: RegistrationContactDto | null;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [c, setC] = useState({ name: contact?.name ?? "", role: contact?.role ?? "", email: contact?.email ?? "", phone: contact?.phone ?? "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const errors = tried ? contactErrors(c) : {};
  const bad = (key: "name" | "email" | "phone"): { className: string; "aria-invalid"?: true; "aria-describedby"?: string } => ({
    className: `field${errors[key] ? " field-err" : ""}`,
    ...(errors[key] ? { "aria-invalid": true as const, "aria-describedby": `ct-${key}-err` } : {}),
  });
  const line = (key: "name" | "email" | "phone"): React.JSX.Element | null =>
    errors[key] ? (
      <span className="err" id={`ct-${key}-err`}>
        {errors[key]}
      </span>
    ) : null;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    if (Object.keys(contactErrors(c)).length > 0) return;
    setBusy(true);
    setFormError(null);
    const body = { name: c.name, role: c.role, email: c.email, phone: c.phone };
    const result = contact
      ? await updateRegistrationContactAction({ id: deal.id, contactId: contact.id, contact: body })
      : await addRegistrationContactAction({ id: deal.id, contact: body });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    toast(contact ? "Contact updated." : "Contact added.");
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={contact ? "Edit contact" : "Add a contact"}
      subtitle={`${deal.customer}, ${PRODUCT_LABEL[deal.product]}`}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            {contact ? "Save contact" : "Add contact"}
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="ct-name" className="lbl">
          Name
        </label>
        <input id="ct-name" type="text" autoComplete="off" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} {...bad("name")} />
        {line("name")}
      </div>
      <div className="fg">
        <label htmlFor="ct-role" className="lbl">
          Role <span className="hint">(for example CISO)</span>
        </label>
        <input id="ct-role" className="field" type="text" value={c.role} onChange={(e) => setC({ ...c, role: e.target.value })} />
      </div>
      <div className="fg">
        <label htmlFor="ct-email" className="lbl">
          Email
        </label>
        <input id="ct-email" type="email" autoComplete="off" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} {...bad("email")} />
        {line("email")}
      </div>
      <div className="fg">
        <label htmlFor="ct-phone" className="lbl">
          Phone
        </label>
        <input id="ct-phone" type="text" inputMode="tel" autoComplete="off" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} {...bad("phone")} />
        {line("phone")}
      </div>
      <span className="hint">At least one contact on the registration needs an email or a phone number.</span>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
    </Drawer>
  );
}

/** Confirm removing one contact. */
export function RemoveContactDialog({
  deal,
  contact,
  onClose,
}: {
  deal: RegistrationDetailDto;
  contact: RegistrationContactDto;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    const result = await removeRegistrationContactAction({ id: deal.id, contactId: contact.id });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    toast("Contact removed.");
    onClose();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Remove ${contact.name}?`}
      subtitle={`${deal.customer}, ${PRODUCT_LABEL[deal.product]}`}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Keep contact
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Remove contact
          </button>
        </>
      }
    >
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : (
        <span className="hint">The registration keeps its other contacts.</span>
      )}
    </Dialog>
  );
}
