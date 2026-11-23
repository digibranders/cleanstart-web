"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEAL_REGIONS, type DealRegion, PARTNER_REGION_LABEL } from "@/lib/domain";
import type { ManagerOptionDto } from "@/lib/dto";
import { issuesToErrors } from "@/server/actions/result";
import { reassignRegistrationAction } from "@/server/actions/registration-reassign";
import { Dropdown } from "../ui/dropdown";
import { useToast } from "../ui/toast";

interface Props {
  deal: { id: string; customer: string; managerId: string | null; region: DealRegion };
  managers: ManagerOptionDto[];
}

/** Change the manager and region of a waiting registration. The caller shows it to partner managers on pending deals only. */
export function ReassignControl({ deal, managers }: Props): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [managerId, setManagerId] = useState(deal.managerId ?? managers[0]?.id ?? "");
  const [region, setRegion] = useState<DealRegion>(deal.region);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unchanged = managerId === deal.managerId && region === deal.region;

  const start = (): void => {
    setManagerId(deal.managerId ?? managers[0]?.id ?? "");
    setRegion(deal.region);
    setError(null);
    setOpen(true);
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    const result = await reassignRegistrationAction({ id: deal.id, managerId, region });
    setBusy(false);
    if (!result.ok) {
      setError(issuesToErrors(result.error).managerId ?? result.error.message);
      return;
    }
    setOpen(false);
    toast(`${deal.customer} reassigned.`);
    router.refresh();
  };

  if (!open) {
    return (
      <div className="fg">
        <span className="lbl">Routing</span>
        <span>
          <button type="button" className="btn btn-s" onClick={start}>
            Reassign manager or region
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="fg" role="group" aria-label="Reassign this registration">
      <span className="lbl">Reassign manager or region</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Dropdown
          variant="field"
          ariaLabel="Partner manager"
          value={managerId}
          options={managers.map((m) => ({ value: m.id, label: m.name }))}
          onChange={setManagerId}
        />
        <Dropdown
          variant="field"
          ariaLabel="Region"
          value={region}
          options={DEAL_REGIONS.map((r) => ({ value: r, label: PARTNER_REGION_LABEL[r] }))}
          onChange={(value) => setRegion(value as DealRegion)}
        />
      </div>
      {error ? (
        <span className="err" role="alert">
          {error}
        </span>
      ) : null}
      <span style={{ display: "inline-flex", gap: 8 }}>
        <button type="button" className="btn btn-s" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="button" className="btn btn-p" disabled={busy || unchanged || !managerId} onClick={save}>
          Save
        </button>
      </span>
    </div>
  );
}
