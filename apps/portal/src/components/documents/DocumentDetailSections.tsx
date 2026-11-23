'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { fmtLong, plural } from '@/lib/dates';
import type { DocumentVersionDto } from '@/lib/dto';
import { getDocumentDetailAction, restoreDocumentVersionAction } from '@/server/actions/documents';
import type { DocumentDetailDto } from '@/server/files/document-service';
import { formatLabel } from '@/server/files/rules';

const NOT_OPENED_SHOWN = 8;

/**
 * "Opened by", "Not opened yet" and the file history, for the edit drawer. Loaded when the drawer opens so the library
 * itself stays one query. `refreshKey` changes when the file is replaced, so the history reloads.
 */
export function DocumentDetailSections({
  documentId,
  refreshKey,
  canRestore,
  onChanged,
}: {
  documentId: string;
  refreshKey: number;
  canRestore: boolean;
  onChanged: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [detail, setDetail] = useState<DocumentDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    const result = await getDocumentDetailAction({ id: documentId });
    if (result.ok) {
      setDetail(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
  }, [documentId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is the signal to reload after a replace
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const restore = async (version: DocumentVersionDto): Promise<void> => {
    if (restoring !== null) return;
    setRestoring(version.version);
    const result = await restoreDocumentVersionAction({ id: documentId, version: version.version });
    setRestoring(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`Version ${version.version} is current again`);
    await load();
    onChanged();
  };

  if (error && !detail) {
    return (
      <div className="note note-amber" role="alert">
        <span>{error}</span>
      </div>
    );
  }
  if (!detail) return <p className="hint">Loading who opened it and the file history.</p>;

  const { engagement, versions } = detail;
  const notOpened = showAll ? engagement.notOpened : engagement.notOpened.slice(0, NOT_OPENED_SHOWN);
  return (
    <>
      <section aria-labelledby="dd-opened" className="fg">
        <h3 id="dd-opened" className="lbl">
          Opened by {engagement.openedBy.length > 0 ? `(${plural(engagement.openedBy.length, 'partner')})` : ''}
        </h3>
        {engagement.openedBy.length === 0 ? (
          <span className="hint">No partner has opened it yet.</span>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Partner</th>
                <th scope="col" className="r">
                  Opens
                </th>
                <th scope="col" className="r">
                  Last opened
                </th>
              </tr>
            </thead>
            <tbody>
              {engagement.openedBy.map((row) => (
                <tr key={row.partnerId}>
                  <td style={{ whiteSpace: 'normal' }}>{row.partnerName}</td>
                  <td className="tnum r">{row.opens}</td>
                  <td className="tnum r t-sec">{fmtLong(row.lastOpenedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="dd-not" className="fg">
        <h3 id="dd-not" className="lbl">
          Not opened yet {engagement.notOpened.length > 0 ? `(${engagement.notOpened.length})` : ''}
        </h3>
        {engagement.notOpened.length === 0 ? (
          <span className="hint">Everyone it reaches has opened it.</span>
        ) : (
          <>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notOpened.map((row) => (
                <li key={row.partnerId}>{row.partnerName}</li>
              ))}
            </ul>
            {engagement.notOpened.length > NOT_OPENED_SHOWN ? (
              <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show fewer' : `Show all ${engagement.notOpened.length}`}
              </button>
            ) : null}
          </>
        )}
      </section>

      <section aria-labelledby="dd-ver" className="fg">
        <h3 id="dd-ver" className="lbl">
          File versions
        </h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {versions.map((v) => (
            <li key={v.version} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span className="li-t" style={{ minWidth: 0 }}>
                <span className="li-n" style={{ overflowWrap: 'anywhere' }}>
                  Version {v.version} {v.current ? <Badge tone="accepted">Current</Badge> : null}
                </span>
                <span className="li-s">
                  {v.originalName}, {formatLabel({ mime: v.mime, fileSize: v.fileSize, durationMinutes: null })}
                </span>
                <span className="li-s">
                  {v.current ? 'Updated' : 'Replaced'} {fmtLong(v.at)}
                  {v.keptUntil ? `, kept until ${fmtLong(v.keptUntil)}` : ''}
                </span>
                {v.changeNote ? <span className="li-s">Note: {v.changeNote}</span> : null}
              </span>
              {v.current || !canRestore ? null : (
                <button
                  type="button"
                  className="btn btn-s"
                  disabled={restoring !== null}
                  onClick={() => void restore(v)}
                  aria-label={`Restore version ${v.version}`}
                >
                  {restoring === v.version ? 'Restoring' : 'Restore this version'}
                </button>
              )}
            </li>
          ))}
        </ul>
        <span className="hint">Replaced files are kept for 30 days. After that the old file is removed and cannot be restored.</span>
        {error ? (
          <div className="note note-amber" role="alert">
            <span>{error}</span>
          </div>
        ) : null}
      </section>
    </>
  );
}
