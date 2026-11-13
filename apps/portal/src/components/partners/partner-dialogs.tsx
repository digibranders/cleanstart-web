"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/overlay";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, type PartnerCategory } from "@/lib/domain";
import type { ManagerOptionDto } from "@/lib/dto";
import { codeFromLabel } from "@/lib/people";
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
