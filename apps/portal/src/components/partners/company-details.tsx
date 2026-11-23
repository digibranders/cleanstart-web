"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadFile } from "@/components/documents/upload-client";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { type CompanyDetailsInput, LOGO_ACCEPT, LOGO_MAX_BYTES, LOGO_TYPE_MESSAGE, LOGO_TYPES } from "@/lib/company-profile";
import { COUNTRIES, findCountry } from "@/lib/deal-form";
import { HEADCOUNT_BAND_LABEL, HEADCOUNT_BANDS } from "@/lib/domain";
import type { CompanyDetailsDto } from "@/lib/dto";
import { initialsOf } from "@/lib/people";
import { confirmLogoAction, createLogoTicketAction, removeLogoAction, updateCompanyDetailsAction } from "@/server/actions/company-profile";
import { issuesToErrors } from "@/server/actions/result";

export const detailsOf = (d: CompanyDetailsDto): CompanyDetailsInput => ({
  legalName: d.legalName ?? "",
  taxId: d.taxId ?? "",
  hqCountry: d.hqCountry ?? "",
  headcountBand: d.headcountBand ?? "",
  billingContactName: d.billingContactName ?? "",
  billingContactEmail: d.billingContactEmail ?? "",
  supportContactName: d.supportContactName ?? "",
  supportContactEmail: d.supportContactEmail ?? "",
});

export const sameDetails = (a: CompanyDetailsInput, b: CompanyDetailsInput): boolean =>
  (Object.keys(a) as Array<keyof CompanyDetailsInput>).every((key) => a[key] === b[key]);

const COUNTRY_OPTIONS: readonly DropdownOption[] = [{ value: "", label: "Not set" }, ...COUNTRIES.map((c) => ({ value: c.code, label: c.name }))];
const HEADCOUNT_OPTIONS: readonly DropdownOption[] = [
  { value: "", label: "Not set" },
  ...HEADCOUNT_BANDS.map((band) => ({ value: band, label: HEADCOUNT_BAND_LABEL[band] })),
];

type Errors = Partial<Record<keyof CompanyDetailsInput | "form", string>>;

/** Saves through updateCompanyDetailsAction; field issues from the server land under their input. */
export async function saveDetails(
  partnerId: string | undefined,
  values: CompanyDetailsInput,
): Promise<{ ok: true } | { ok: false; errors: Errors }> {
  const result = await updateCompanyDetailsAction({ ...(partnerId ? { partnerId } : {}), ...values });
  if (result.ok) return { ok: true };
  return { ok: false, errors: { ...(issuesToErrors(result.error) as Errors), form: result.error.message } };
}

interface FieldsProps {
  values: CompanyDetailsInput;
  onChange: (next: CompanyDetailsInput) => void;
  readOnly: boolean;
  errors: Errors;
  /** Keeps ids unique when two forms are on one page. */
  idPrefix: string;
}

const TEXT_FIELDS: ReadonlyArray<{ key: keyof CompanyDetailsInput; label: string; type?: "email"; hint?: string; max: number }> = [
  { key: "legalName", label: "Legal name", max: 200, hint: "The registered name on your contracts." },
  { key: "taxId", label: "Tax ID", max: 60, hint: "VAT, GST or EIN number." },
  { key: "billingContactName", label: "Billing contact", max: 120 },
  { key: "billingContactEmail", label: "Billing contact email", type: "email", max: 254 },
  { key: "supportContactName", label: "Support contact", max: 120 },
  { key: "supportContactEmail", label: "Support contact email", type: "email", max: 254 },
];

export function DetailsFields({ values, onChange, readOnly, errors, idPrefix }: FieldsProps): React.JSX.Element {
  const set = (key: keyof CompanyDetailsInput, value: string): void => onChange({ ...values, [key]: value } as CompanyDetailsInput);
  const text = (field: (typeof TEXT_FIELDS)[number]): React.JSX.Element => {
    const id = `${idPrefix}-${field.key}`;
    const error = errors[field.key];
    return (
      <div className="fg" key={field.key}>
        <label htmlFor={id} className="lbl">
          {field.label}
        </label>
        <input
          id={id}
          className={`field${error ? " field-err" : ""}`}
          type={field.type ?? "text"}
          maxLength={field.max}
          value={values[field.key]}
          readOnly={readOnly}
          onChange={(event) => set(field.key, event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {error ? (
          <span id={`${id}-err`} className="err" role="alert">
            {error}
          </span>
        ) : field.hint && !readOnly ? (
          <span className="hint">{field.hint}</span>
        ) : null}
      </div>
    );
  };
  const country = values.hqCountry ? (findCountry(values.hqCountry)?.name ?? values.hqCountry) : "Not set";
  const band = values.headcountBand ? HEADCOUNT_BAND_LABEL[values.headcountBand] : "Not set";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="grid2">
        {text(TEXT_FIELDS[0] as (typeof TEXT_FIELDS)[number])}
        {text(TEXT_FIELDS[1] as (typeof TEXT_FIELDS)[number])}
        <div className="fg">
          <label htmlFor={`${idPrefix}-hqCountry`} className="lbl">
            Headquarters country
          </label>
          {readOnly ? (
            <input id={`${idPrefix}-hqCountry`} className="field" type="text" value={country} readOnly />
          ) : (
            <Dropdown
              id={`${idPrefix}-hqCountry`}
              variant="field"
              value={values.hqCountry}
              options={COUNTRY_OPTIONS}
              invalid={Boolean(errors.hqCountry)}
              onChange={(value) => set("hqCountry", value)}
            />
          )}
          {errors.hqCountry ? (
            <span className="err" role="alert">
              {errors.hqCountry}
            </span>
          ) : null}
        </div>
        <div className="fg">
          <label htmlFor={`${idPrefix}-headcountBand`} className="lbl">
            Company size
          </label>
          {readOnly ? (
            <input id={`${idPrefix}-headcountBand`} className="field" type="text" value={band} readOnly />
          ) : (
            <Dropdown
              id={`${idPrefix}-headcountBand`}
              variant="field"
              value={values.headcountBand}
              options={HEADCOUNT_OPTIONS}
              onChange={(value) => set("headcountBand", value)}
            />
          )}
        </div>
      </div>
      <div className="grid2">{TEXT_FIELDS.slice(2).map(text)}</div>
    </div>
  );
}

interface LogoEditorProps {
  partnerId?: string;
  name: string;
  logoUrl: string | null;
  canEdit: boolean;
  /** Called with the new logo URL (null when removed) after the server accepted the change. */
  onChanged: (logoUrl: string | null) => void;
}

/** Logo preview with Upload, Replace and Remove. PNG or JPG, 1 MB. Checked here for fast feedback and again by the server. */
export function LogoEditor({ partnerId, name, logoUrl, canEdit, onChanged }: LogoEditorProps): React.JSX.Element {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scope = partnerId ? { partnerId } : {};

  const choose = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!LOGO_TYPES.some((type) => type.ext === ext)) return setError(LOGO_TYPE_MESSAGE);
    if (file.size > LOGO_MAX_BYTES) return setError("The logo can be up to 1 MB.");
    setBusy("Uploading 0%");
    const uploaded = await uploadFile({
      file,
      requestTicket: () => createLogoTicketAction({ ...scope, originalName: file.name, size: file.size }),
      onProgress: (percent) => setBusy(`Uploading ${percent}%`),
    });
    if (!uploaded.ok) {
      setBusy(null);
      return setError(uploaded.error.message);
    }
    const saved = await confirmLogoAction({ ...scope, ...uploaded.data });
    setBusy(null);
    if (!saved.ok) return setError(saved.error.message);
    onChanged(saved.data.logoUrl);
    toast("Logo saved");
  };

  const remove = async (): Promise<void> => {
    setError(null);
    setBusy("Removing");
    const result = await removeLogoAction(scope);
    setBusy(null);
    if (!result.ok) return setError(result.error.message);
    onChanged(null);
    toast("Logo removed");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", width: 56, height: 56 }}>
        <span className="av-xl">
          <Avatar initials={initialsOf(name)} logoUrl={logoUrl} />
        </span>
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="lbl">Company logo</span>
        {canEdit ? (
          <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input
              ref={input}
              type="file"
              accept={LOGO_ACCEPT}
              hidden
              onChange={(event) => {
                void choose(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button type="button" className="btn btn-s" disabled={busy !== null} onClick={() => input.current?.click()}>
              {busy ?? (logoUrl ? "Replace logo" : "Upload logo")}
            </button>
            {logoUrl ? (
              <button type="button" className="btn btn-g" disabled={busy !== null} onClick={() => void remove()}>
                Remove
              </button>
            ) : null}
          </span>
        ) : null}
        <span className="hint">PNG or JPG, up to 1 MB. Without a logo, the company initials show.</span>
        {error ? (
          <span className="err" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Staff: company logo and details for one partner, from the partner drawer. Mounted only while open. */
export function DetailsDialog({ partner, onClose }: { partner: { id: string; name: string } & CompanyDetailsDto; onClose: () => void }): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState(() => detailsOf(partner));
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const result = await saveDetails(partner.id, values);
    setBusy(false);
    if (!result.ok) return setErrors(result.errors);
    toast(`${partner.name} details saved`);
    router.refresh();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit company details"
      subtitle={partner.name}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Save
          </button>
        </>
      }
    >
      <LogoEditor
        partnerId={partner.id}
        name={partner.name}
        logoUrl={logoUrl}
        canEdit
        onChanged={(next) => {
          setLogoUrl(next);
          router.refresh();
        }}
      />
      <DetailsFields values={values} onChange={(next) => { setValues(next); setErrors({}); }} readOnly={false} errors={errors} idPrefix="cd" />
      {errors.form && Object.keys(errors).length === 1 ? (
        <span className="err" role="alert">
          {errors.form}
        </span>
      ) : null}
    </Dialog>
  );
}
