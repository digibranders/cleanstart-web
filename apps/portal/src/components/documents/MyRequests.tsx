import { requestTone } from '@/components/documents/request-view';
import { Badge } from '@/components/ui/badge';
import { fmtLong } from '@/lib/dates';
import { DOC_PRODUCT_LABEL, MATERIAL_REQUEST_STATUS_LABEL } from '@/lib/domain';
import type { MaterialRequestDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';

/** The partner's own material requests under the library, with where each one stands and the answer. Hidden when there are none. */
export function MyRequests({ requests }: { requests: readonly MaterialRequestDto[] }): React.JSX.Element | null {
  if (requests.length === 0) return null;
  return (
    <section id="requests" aria-labelledby="my-req" className="card clip">
      <div className="card-h">
        <h2 id="my-req" className="card-t">
          Your requests
        </h2>
        <span className="card-meta tnum">{requests.length}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {requests.map((r) => (
          <li key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 16px', borderTop: '1px solid var(--line, #EEEBF7)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="li-n">{r.subject}</span>
              <Badge tone={requestTone(r.status)}>{MATERIAL_REQUEST_STATUS_LABEL[r.status]}</Badge>
            </span>
            <span className="li-s">
              {DOC_PRODUCT_LABEL[r.product]}, asked by {r.requestedByName} on {fmtLong(r.createdAt)}
              {r.closedAt ? `, closed ${fmtLong(r.closedAt)}` : ''}
            </span>
            {r.responseNote ? <span style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>CleanStart: {r.responseNote}</span> : null}
            {r.documentId && r.documentTitle ? (
              <a className="linkbtn" style={{ alignSelf: 'flex-start' }} href={`${ROUTES.partner.documents}?doc=${r.documentId}`}>
                Open {r.documentTitle}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
