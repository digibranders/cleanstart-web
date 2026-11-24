'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { fmtLong, plural } from '@/lib/dates';
import type { DocumentVersionDto } from '@/lib/dto';
import { getDocumentDetailAction, restoreDocumentVersionAction } from '@/server/actions/documents';
import type { DocumentDetailDto } from '@/server/files/document-service';
import { formatLabel } from '@/server/files/rules';

const SHOWN = 6;
const NOT_OPENED_SHOWN = 12;

export interface DocumentDetailState {
  detail: DocumentDetailDto | null;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads "Opened by", "Not opened yet" and the file history for the edit drawer, so the library itself stays one query.
 * `refreshKey` changes when the file is replaced, so the history reloads. One load feeds both the Activity and File tabs.
 */
export function useDocumentDetail(documentId: string, refreshKey: number): DocumentDetailState {
  const [detail, setDetail] = useState<DocumentDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
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
    void reload();
  }, [reload, refreshKey]);

  return { detail, error, reload };
}

function DetailStatus({ state, what }: { state: DocumentDetailState; what: string }): React.JSX.Element {
  if (state.error) {
    return (
      <div className="note note-amber" role="alert">
        <span>{state.error}</span>
      </div>
    );
  }
  return <p className="hint">Loading {what}.</p>;
}

/** Which partners opened the document, most recent first, and which of the partners it reaches have not. */
export function DocumentActivity({ state }: { state: DocumentDetailState }): React.JSX.Element {
  const [showAllOpened, setShowAllOpened] = useState(false);
  const [showAllNot, setShowAllNot] = useState(false);
  const { detail } = state;
  if (!detail) return <DetailStatus state={state} what="who opened it" />;

  const { openedBy, notOpened } = detail.engagement;
  const opened = showAllOpened ? openedBy : openedBy.slice(0, SHOWN);
  const waiting = showAllNot ? notOpened : notOpened.slice(0, NOT_OPENED_SHOWN);
  return (
    <>
      <section aria-labelledby="dd-opened" className="fg">
        <h3 id="dd-opened" className="dsec-h dsec-h-first">
          Opened by {openedBy.length > 0 ? <span className="cnt">{plural(openedBy.length, 'partner')}</span> : null}
        </h3>
        {openedBy.length === 0 ? (
          <p className="dsec-d">No partner has opened it yet.</p>
        ) : (
          <ul className="dpeople">
            {opened.map((row) => (
              <li key={row.partnerId}>
                <span className="dpeople-n">{row.partnerName}</span>
                <span className="dpeople-m tnum">
                  {plural(row.opens, 'open')}, last {fmtLong(row.lastOpenedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {openedBy.length > SHOWN ? (
          <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAllOpened((v) => !v)}>
            {showAllOpened ? 'Show fewer' : `Show all ${openedBy.length}`}
          </button>
        ) : null}
      </section>

      <section aria-labelledby="dd-not" className="fg">
        <h3 id="dd-not" className="dsec-h">
          Not opened yet {notOpened.length > 0 ? <span className="cnt">{notOpened.length}</span> : null}
        </h3>
        {notOpened.length === 0 ? (
          <p className="dsec-d">Everyone it reaches has opened it.</p>
        ) : (
          <ul className="dchips">
            {waiting.map((row) => (
              <li key={row.partnerId} className="dchip">
                {row.partnerName}
              </li>
            ))}
          </ul>
        )}
        {notOpened.length > NOT_OPENED_SHOWN ? (
          <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAllNot((v) => !v)}>
            {showAllNot ? 'Show fewer' : `Show all ${notOpened.length}`}
          </button>
        ) : null}
      </section>
    </>
  );
}

/** Every kept file, newest first, with a way back to an older one. */
export function DocumentVersions({
  documentId,
  state,
  canRestore,
  onChanged,
}: {
  documentId: string;
  state: DocumentDetailState;
  canRestore: boolean;
  onChanged: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { detail } = state;

  const restore = async (version: DocumentVersionDto): Promise<void> => {
    if (restoring !== null) return;
    setRestoring(version.version);
    const result = await restoreDocumentVersionAction({ id: documentId, version: version.version });
    setRestoring(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    toast(`Version ${version.version} is current again`);
    await state.reload();
    onChanged();
  };

  if (!detail) return <DetailStatus state={state} what="the file history" />;
  return (
    <section aria-labelledby="dd-ver" className="fg">
      <h3 id="dd-ver" className="dsec-h">
        File history <span className="cnt">{plural(detail.versions.length, 'version')}</span>
      </h3>
      <ul className="dvers">
        {detail.versions.map((v) => (
          <li key={v.version} className={v.current ? 'dvers-cur' : undefined}>
            <span className="li-t" style={{ minWidth: 0 }}>
              <span className="li-n" style={{ overflowWrap: 'anywhere' }}>
                Version {v.version} {v.current ? <Badge tone="accepted">Current</Badge> : null}
              </span>
              <span className="li-s" style={{ overflowWrap: 'anywhere' }}>
                {v.originalName}, {formatLabel({ mime: v.mime, fileSize: v.fileSize, durationMinutes: null })}
              </span>
              <span className="li-s">
                {v.current ? 'Updated' : 'Replaced'} {fmtLong(v.at)}
                {v.keptUntil ? `, kept until ${fmtLong(v.keptUntil)}` : ''}
              </span>
              {v.changeNote ? <span className="li-s">Note: {v.changeNote}</span> : null}
            </span>
            {v.current || !canRestore ? null : (
              <button type="button" className="btn btn-s" disabled={restoring !== null} onClick={() => void restore(v)} aria-label={`Restore version ${v.version}`}>
                {restoring === v.version ? 'Restoring' : 'Restore'}
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
  );
}
