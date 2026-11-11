"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/overlay";
import { CATEGORIES, MANAGERS, type Partner, type PartnerCategory } from "@/data/partners";
import { Seg } from "./seg";

interface DialogProps {
  partner: Partner;
  onClose: () => void;
}

/** Both dialogs are mounted only while open, so each opening starts from the partner's current value. */
export function CategoryDialog({ partner, onClose, onSave }: DialogProps & { onSave: (value: PartnerCategory) => void }): React.JSX.Element {
  const [value, setValue] = useState<PartnerCategory>(partner.category);
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
          <button type="button" className="btn btn-p" onClick={() => onSave(value)}>
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="cat-l" className="lbl">
          Category
        </span>
        <Seg options={CATEGORIES} value={value} onChange={setValue} labelledBy="cat-l" />
      </div>
    </Dialog>
  );
}

export function ManagerDialog({ partner, onClose, onSave }: DialogProps & { onSave: (value: string) => void }): React.JSX.Element {
  const [value, setValue] = useState(partner.manager);
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
          <button type="button" className="btn btn-p" onClick={() => onSave(value)}>
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="pm-l" className="lbl">
          Partner manager
        </span>
        <Seg options={MANAGERS} value={value} onChange={setValue} labelledBy="pm-l" />
        <span className="hint">The partner admin is told by email who their new partner manager is.</span>
      </div>
    </Dialog>
  );
}
