"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, type PartnerCategory, type PartnerRegion } from "@/lib/domain";
import { useRegions } from "@/components/regions-context";
import type { ManagerOptionDto, PartnerDetailDto } from "@/lib/dto";
import { codeFromLabel } from "@/lib/people";
import { updatePartnerIdentityAction } from "@/server/actions/partner-identity";
import { updateCompanyProfileAction } from "@/server/actions/partners";
import { issuesToErrors } from "@/server/actions/result";
import { managerChoices } from "./manager-options";
import { Seg } from "./seg";

interface DialogProps {
  partner: { name: string };
  onClose: () => void;
}

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);

/** Both dialogs are mounted only while open, so each opening starts from the partner's current value. */
export function CategoryDialog({
  partner,
  current,
  onClose,
  onSave,
}: DialogProps & { current: PartnerCategory; onSave: (value: PartnerCategory) => void }): React.JSX.Element {
  const [label, setLabel] = useState<string>(PARTNER_CATEGORY_LABEL[current]);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Change category"
      subtitle={`${partner.name}. The category decides which documents its people can open.`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              const code = codeFromLabel(PARTNER_CATEGORY_LABEL, label);
              if (code) onSave(code);
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="cat-l" className="lbl">
          Category
        </span>
        <Seg options={CATEGORY_OPTIONS} value={label} onChange={setLabel} labelledBy="cat-l" />
      </div>
    </Dialog>
  );
}

export function ManagerDialog({
  partner,
  currentId,
  managers,
  onClose,
  onSave,
}: DialogProps & { currentId: string | null; managers: readonly ManagerOptionDto[]; onSave: (managerId: string) => void }): React.JSX.Element {
  const choices = managerChoices(managers);
  const [chosenId, setChosenId] = useState<string | null>(managers.find((m) => m.id === currentId)?.id ?? choices[0]?.id ?? null);
  const chosenLabel = choices.find((c) => c.id === chosenId)?.label ?? "";
  return (
    <Dialog
      open
      onClose={onClose}
      title="Change partner manager"
      subtitle={`${partner.name}. The new manager gets its deal approvals and messages.`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              if (chosenId) onSave(chosenId);
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="pm-l" className="lbl">
          Partner manager
        </span>
        <Seg
          options={choices.map((c) => c.label)}
          value={chosenLabel}
          onChange={(label) => setChosenId(choices.find((c) => c.label === label)?.id ?? null)}
          labelledBy="pm-l"
        />
        <span className="hint">The partner's deal approvals and messages move to the new manager.</span>
      </div>
    </Dialog>
  );
}

/** Name, sign-in domain and region. Partner managers only. The CRM company is not touched. */
export function IdentityDialog({ partner, onClose }: { partner: PartnerDetailDto; onClose: () => void }): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const { offer } = useRegions();
  const regionOptions: readonly DropdownOption[] = offer(partner.region).map((r) => ({ value: r.key, label: r.name }));
  const [name, setName] = useState(partner.name);
  const [domain, setDomain] = useState(partner.domain);
  const [region, setRegion] = useState<PartnerRegion>(partner.region);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const unchanged = name.trim() === partner.name && domain.trim().toLowerCase() === partner.domain && region === partner.region;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const result = await updatePartnerIdentityAction({
      id: partner.id,
      ...(name.trim() !== partner.name ? { name: name.trim() } : {}),
      ...(domain.trim().toLowerCase() !== partner.domain ? { domain: domain.trim() } : {}),
      ...(region !== partner.region ? { region } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setErrors({ ...issuesToErrors(result.error), form: result.error.message });
      return;
    }
    toast(`${result.data.name} updated`);
    router.refresh();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit name, domain and region"
      subtitle={partner.name}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy || unchanged}>
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="id-name" className="lbl">
          Company name
        </label>
        <input id="id-name" className={`field${errors.name ? " field-err" : ""}`} type="text" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name ? <span className="err">{errors.name}</span> : null}
        <span className="hint">The HubSpot company keeps its current name. A rename here is not sent to the CRM.</span>
      </div>
      <div className="fg">
        <label htmlFor="id-domain" className="lbl">
          Domain
        </label>
        <input id="id-domain" className={`field${errors.domain ? " field-err" : ""}`} type="text" autoComplete="off" maxLength={253} value={domain} onChange={(e) => setDomain(e.target.value)} aria-invalid={Boolean(errors.domain)} />
        {errors.domain ? <span className="err">{errors.domain}</span> : <span className="hint">People with an email at this domain can ask for access.</span>}
      </div>
      <div className="fg">
        <label htmlFor="id-region" className="lbl">
          Region
        </label>
        <Dropdown
          id="id-region"
          variant="field"
          value={region}
          options={regionOptions}
          onChange={setRegion}
        />
        <span className="hint">Existing registrations keep their region.</span>
      </div>
      {errors.form && !errors.name && !errors.domain ? (
        <span className="err" role="alert">
          {errors.form}
        </span>
      ) : null}
    </Dialog>
  );
}

/** Website, phone, address and what the company sells. Same action the partner admin's Company page uses. */
export function ProfileDialog({ partner, onClose }: { partner: PartnerDetailDto; onClose: () => void }): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [website, setWebsite] = useState(partner.website ?? "");
  const [phone, setPhone] = useState(partner.phone ?? "");
  const [address, setAddress] = useState(partner.address ?? "");
  const [about, setAbout] = useState(partner.about ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateCompanyProfileAction({ partnerId: partner.id, website, phone, address, about });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`${partner.name} profile saved`);
    router.refresh();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit company profile"
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
      <div className="fg">
        <label htmlFor="pf-web" className="lbl">
          Website
        </label>
        <input id="pf-web" className="field" type="text" maxLength={200} value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="pf-phone" className="lbl">
          Phone
        </label>
        <input id="pf-phone" className="field" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="pf-address" className="lbl">
          Address
        </label>
        <input id="pf-address" className="field" type="text" maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="pf-about" className="lbl">
          What they sell
        </label>
        <textarea id="pf-about" className="field" rows={4} maxLength={1000} value={about} onChange={(e) => setAbout(e.target.value)} />
      </div>
      {error ? (
        <span className="err" role="alert">
          {error}
        </span>
      ) : null}
    </Dialog>
  );
}

/** Suspending needs a typed reason. It goes into the audit entry and shows in the partner's drawer. */
export function SuspendDialog({
  partner,
  onClose,
  onSave,
}: DialogProps & { partner: { name: string; users: number }; onSave: (reason: string) => void }): React.JSX.Element {
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const missing = reason.trim() === "";
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Suspend ${partner.name}?`}
      subtitle={`Its ${partner.users} ${partner.users === 1 ? "user loses" : "users lose"} access at once. Deals stay in HubSpot.`}
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        if (!missing) onSave(reason.trim());
      }}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dd">
            Suspend access
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="sp-reason" className="lbl">
          Reason
        </label>
        <textarea
          id="sp-reason"
          className={`field${tried && missing ? " field-err" : ""}`}
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={tried && missing}
        />
        {tried && missing ? <span className="err">Give a reason for the suspension.</span> : <span className="hint">Kept in the audit log and shown here until access is restored.</span>}
      </div>
    </Dialog>
  );
}
