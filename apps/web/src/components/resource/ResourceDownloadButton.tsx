"use client";

import { useState } from "react";
import type { Form } from "@/lib/forms";
import { ResourceGateModal } from "@/components/resource/ResourceGateModal";
import { trackEvent } from "@/lib/analytics/track";

interface ResourceDownloadButtonProps {
  resourceId: string | number;
  resourceTitle: string;
  resourceSlug: string;
  gated: boolean;
  assetHref: string;
  gateForm: Form | null;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export function ResourceDownloadButton({
  resourceId,
  resourceTitle,
  resourceSlug,
  gated,
  assetHref,
  gateForm,
  className,
  style,
  children,
}: ResourceDownloadButtonProps): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  // Non-gated, or gating data missing — render the original direct download link.
  if (!gated || !gateForm) {
    return (
      <a
        href={assetHref}
        download={assetHref !== "#"}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  const handleClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    try {
      // Cookie-bypass: check if this browser has already unlocked this resource.
      const tokenRes = await fetch(
        `${CMS_URL}/api/resources/${encodeURIComponent(resourceSlug)}/token`,
        { credentials: "include" },
      );
      if (tokenRes.ok) {
        const json = (await tokenRes.json()) as {
          ok?: boolean;
          download?: { url: string };
        };
        if (json.ok && json.download?.url) {
          const absolute = json.download.url.startsWith("http")
            ? json.download.url
            : `${CMS_URL}${json.download.url}`;
          trackEvent("file_download", {
            resource_slug: resourceSlug,
            resource_title: resourceTitle,
            gated: true,
          });
          window.location.assign(absolute);
          return;
        }
      }
      // 403 / 404 / no cookie → open the gate modal.
      setModalOpen(true);
    } catch {
      setModalOpen(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        style={style}
        disabled={checking}
      >
        {children}
      </button>
      <ResourceGateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        form={gateForm}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
        onUnlocked={() => {
          /* modal handles its own redirect */
        }}
      />
    </>
  );
}
