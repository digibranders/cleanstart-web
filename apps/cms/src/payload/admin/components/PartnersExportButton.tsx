'use client';

import { useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

/**
 * "Export CSV" button above the partner-applications list. Fetches the export
 * endpoint with credentials, turns the response into a Blob, and triggers a
 * browser download. Mounted via beforeListTable.
 */
export const PartnersExportButton = (): ReactElement => {
  const { config } = useConfig();
  const [busy, setBusy] = useState(false);
  const serverURL = config?.serverURL ?? '';

  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`${serverURL}/api/partner-applications/export-csv`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Export failed. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partners-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (res.headers.get('x-partners-truncated') === 'true') {
        alert(`Export truncated at ${res.headers.get('x-partners-truncated-at')} rows.`);
      }
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [serverURL]);

  return (
    <div className="cs-partners-export">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        onClick={() => void handleExport()}
        disabled={busy}
      >
        {busy ? 'Exporting…' : 'Export CSV'}
      </button>
    </div>
  );
};

export default PartnersExportButton;
