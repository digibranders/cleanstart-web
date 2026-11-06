"use client";

import { createContext, useContext } from "react";

import { useResourceUnlock } from "@/components/resource/ResourceDownloadButton";
import { ResourceGateModal } from "@/components/resource/ResourceGateModal";

interface UnlockState {
  unlock: () => Promise<void>;
  checking: boolean;
}

const UnlockContext = createContext<UnlockState | null>(null);

/** What the page needs to know about the report it gates. */
export interface ReportGateConfig {
  resourceId: string | number;
  resourceTitle: string;
  resourceSlug: string;
  gateFormId: number;
}

interface ReportGateProviderProps extends ReportGateConfig {
  children: React.ReactNode;
}

/**
 * One gate for the whole landing page. The page carries several download
 * buttons; each one opening its own copy of the modal would repeat the dialog,
 * its heading and its ids once per button.
 */
export function ReportGateProvider({
  resourceId,
  resourceTitle,
  resourceSlug,
  gateFormId,
  children,
}: ReportGateProviderProps): React.ReactElement {
  const { unlock, checking, modalOpen, closeModal } = useResourceUnlock({
    resourceTitle,
    resourceSlug,
  });

  return (
    <UnlockContext value={{ unlock, checking }}>
      {children}
      <ResourceGateModal
        open={modalOpen}
        onClose={closeModal}
        resourceId={resourceId}
        gateFormId={gateFormId}
        resourceTitle={resourceTitle}
        onUnlocked={() => {
          /* modal handles its own redirect */
        }}
      />
    </UnlockContext>
  );
}

interface ReportGateButtonProps {
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}

export function ReportGateButton({
  className,
  style,
  children,
}: ReportGateButtonProps): React.ReactElement {
  const gate = useContext(UnlockContext);
  if (!gate) throw new Error("ReportGateButton must be rendered inside ReportGateProvider");
  return (
    <button
      type="button"
      onClick={() => void gate.unlock()}
      className={className}
      style={style}
      disabled={gate.checking}
    >
      {children}
    </button>
  );
}
