'use client';

import { useCallback, useMemo, useState } from 'react';
import { requestTone } from '@/components/documents/request-view';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Drawer } from '@/components/ui/overlay';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { useToast } from '@/components/ui/toast';
import { fmtLong, plural } from '@/lib/dates';
import {
  DOC_PRODUCT_LABEL,
  MATERIAL_REQUEST_STATUS_LABEL,
  MATERIAL_REQUEST_STATUSES,
  type MaterialRequestStatus,
} from '@/lib/domain';
import type { DocumentDto, MaterialRequestDto } from '@/lib/dto';
import { updateMaterialRequestAction } from '@/server/actions/documents';

const ANY = 'any';
const NONE = 'none';
const STATUS_FILTER = [
  { value: ANY, label: 'All statuses' },
  ...MATERIAL_REQUEST_STATUSES.map((s) => ({ value: s, label: MATERIAL_REQUEST_STATUS_LABEL[s] })),
];

export interface RequestPerson {
  id: string;
  name: string;
}

/** The Requests tab of /admin/documents: every partner request, filtered by status and partner, worked from a drawer. */
export function RequestsInbox({
  requests,
  assignees,
  docs,
}: {
  requests: readonly MaterialRequestDto[];
  assignees: readonly RequestPerson[];
  docs: readonly DocumentDto[];
}): React.JSX.Element {
  const [status, setStatus] = useState(ANY);
  const [partner, setPartner] = useState(ANY);
  const [openId, setOpenId] = useState<string | null>(null);
  const closeDrawer = useCallback((): void => setOpenId(null), []);

  const partnerOptions = useMemo(() => {
    const seen = new Map(requests.map((r) => [r.partnerId, r.partnerName]));
    return [{ value: ANY, label: 'All partners' }, ...[...seen].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }))];
  }, [requests]);
  const rows = requests.filter((r) => (status === ANY || r.status === status) && (partner === ANY || r.partnerId === partner));
  const open = openId ? (requests.find((r) => r.id === openId) ?? null) : null;

  return (
    <section aria-labelledby="req-h" className="card clip">
      <div className="card-h">
        <h2 id="req-h" className="card-t">
          Requests
        </h2>
        <span className="card-meta tnum">
          {rows.length === requests.length ? plural(requests.length, 'request') : `${rows.length} of ${requests.length}`}
        </span>
      </div>
      <div className="toolbar">
        <div className="filters">
          <Dropdown ariaLabel="Status" value={status} options={STATUS_FILTER} onChange={setStatus} />
          <Dropdown ariaLabel="Partner" value={partner} options={partnerOptions} onChange={setPartner} />
        </div>
      </div>
      <ScrollRegion label="Material requests">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col" className="hide-sm">
                Product
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="hide-sm">
                Assigned to
              </th>
              <th scope="col" className="r">
                Asked
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'normal', minWidth: 180 }}>
                  <button type="button" className="linkbtn li-n" style={{ fontSize: 13, textAlign: 'left' }} onClick={() => setOpenId(r.id)}>
                    {r.subject}
                  </button>
                  <span className="li-s" style={{ display: 'block' }}>
                    {r.partnerName}, {r.requestedByName}
                  </span>
                </td>
                <td className="t-sec hide-sm">{DOC_PRODUCT_LABEL[r.product]}</td>
                <td>
                  <Badge tone={requestTone(r.status)}>{MATERIAL_REQUEST_STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className="t-sec hide-sm">{r.assignedToName ?? 'Nobody yet'}</td>
                <td className="tnum r t-sec">{fmtLong(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 ? (
          <div className="empty">No partner has asked for material yet.</div>
        ) : rows.length === 0 ? (
          <div className="empty">No requests match these filters.</div>
        ) : null}
      </ScrollRegion>
      {open ? <RequestDrawer key={open.id} request={open} assignees={assignees} docs={docs} onClose={closeDrawer} /> : null}
    </section>
  );
}

function RequestDrawer({
  request,
  assignees,
  docs,
  onClose,
}: {
  request: MaterialRequestDto;
  assignees: readonly RequestPerson[];
  docs: readonly DocumentDto[];
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [status, setStatus] = useState<MaterialRequestStatus>(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedToId ?? NONE);
  const [documentId, setDocumentId] = useState(request.documentId ?? NONE);
  const [note, setNote] = useState(request.responseNote ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed =
    status !== request.status ||
    assignedTo !== (request.assignedToId ?? NONE) ||
    documentId !== (request.documentId ?? NONE) ||
    note.trim() !== (request.responseNote ?? '');
  const declinedWithoutNote = status === 'declined' && note.trim() === '';

  const save = async (): Promise<void> => {
    if (busy) return;
    if (declinedWithoutNote) {
      setError('Tell the partner why this was declined.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateMaterialRequestAction({
      id: request.id,
      status,
      responseNote: note.trim() === '' ? null : note.trim(),
      documentId: documentId === NONE ? null : documentId,
      assignedTo: assignedTo === NONE ? null : assignedTo,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(status !== request.status ? `Marked ${MATERIAL_REQUEST_STATUS_LABEL[status].toLowerCase()}. ${request.requestedByName} was told.` : 'Saved');
    onClose();
  };

  const assigneeOptions = [{ value: NONE, label: 'Nobody' }, ...assignees.map((a) => ({ value: a.id, label: a.name }))];
  const docOptions = [{ value: NONE, label: 'No document yet' }, ...docs.map((d) => ({ value: d.id, label: d.title }))];

  return (
    <Drawer
      open
      onClose={onClose}
      title={request.subject}
      subtitle={`${request.partnerName}, ${DOC_PRODUCT_LABEL[request.product]}`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose} disabled={busy}>
            Close
          </button>
          <button type="button" className="btn btn-p" onClick={() => void save()} disabled={busy || !changed}>
            {busy ? 'Saving' : 'Save'}
          </button>
        </>
      }
    >
      <dl className="dl">
        <dt>Asked by</dt>
        <dd>
          {request.requestedByName}, {fmtLong(request.createdAt)}
        </dd>
        <dt>Status</dt>
        <dd>
          <Badge tone={requestTone(request.status)}>{MATERIAL_REQUEST_STATUS_LABEL[request.status]}</Badge>
          {request.closedAt ? ` closed ${fmtLong(request.closedAt)}` : ''}
        </dd>
      </dl>
      <div className="fg">
        <span className="lbl">What they asked for</span>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{request.details}</p>
      </div>
      <div className="fg">
        <label htmlFor="rq-assign" className="lbl">
          Assigned to
        </label>
        <Dropdown id="rq-assign" variant="field" value={assignedTo} options={assigneeOptions} onChange={setAssignedTo} />
      </div>
      <div className="fg">
        <span id="rq-status" className="lbl">
          Status
        </span>
        <div className="seg" role="group" aria-labelledby="rq-status" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
          {MATERIAL_REQUEST_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`seg-b${s === status ? ' seg-on' : ''}`}
              aria-pressed={s === status}
              disabled={busy}
              onClick={() => setStatus(s)}
            >
              {MATERIAL_REQUEST_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <span className="hint">Changing the status sends {request.requestedByName} an in-app notification.</span>
      </div>
      <div className="fg">
        <label htmlFor="rq-note" className="lbl">
          Response for the partner
        </label>
        <textarea
          id="rq-note"
          className={`field${declinedWithoutNote && error ? ' field-err' : ''}`}
          rows={4}
          maxLength={1000}
          value={note}
          disabled={busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="fg">
        <label htmlFor="rq-doc" className="lbl">
          Document that answers it
        </label>
        <Dropdown id="rq-doc" variant="field" value={documentId} options={docOptions} onChange={setDocumentId} />
        <span className="hint">The partner sees a link to it once they are allowed to open it.</span>
      </div>
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
    </Drawer>
  );
}
