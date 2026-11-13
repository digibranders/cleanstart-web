'use client';

import { useCallback, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { adminUpdatedLabel, audienceTone } from '@/components/documents/doc-view';
import { Badge, ProductChip } from '@/components/ui/badge';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { audienceLabel, formatLabel } from '@/server/files/rules';

export function AdminDocuments({
  docs,
  partners,
  today,
}: {
  docs: readonly DocumentDto[];
  partners: readonly AudiencePartnerDto[];
  today: string;
}): React.JSX.Element {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const closeUpload = useCallback((): void => setUploadOpen(false), []);
  const closeEdit = useCallback((): void => setEditingId(null), []);

  const opensTotal = docs.reduce((n, d) => n + (d.opens ?? 0), 0);
  const editing = editingId ? (docs.find((d) => d.id === editingId) ?? null) : null;

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Documents</h1>
          <span className="h1-sub">
            {docs.length} documents, opened {opensTotal} times in total. Stored only in the portal,
            never on cleanstart.com.
          </span>
        </div>
        {uploadOpen ? null : (
          <button
            type="button"
            className="btn btn-p"
            onClick={() => setUploadOpen(true)}
          >
            <Icon name="upload" />
            Upload document
          </button>
        )}
      </div>

      <div className="row">
        {uploadOpen ? <UploadDocumentForm onClose={closeUpload} partners={partners} /> : null}

        <section
          aria-labelledby="lib"
          className="card clip"
          style={{ flex: '1 1 620px', minWidth: 0 }}
        >
          <div className="card-h">
            <h2 id="lib" className="card-t">
              Library
            </h2>
            <span className="card-meta">Newest first</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Product</th>
                  <th scope="col">Who can open it</th>
                  <th scope="col" className="r">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    Opens
                  </th>
                  <th scope="col" className="r">
                    Partners
                  </th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 280 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`li-ic ${TYPE_TONE[d.type]}`}>
                          <Icon name={TYPE_ICON[d.type]} />
                        </span>
                        <span className="li-t">
                          <button
                            type="button"
                            className="linkbtn li-n"
                            style={{ fontSize: 13 }}
                            onClick={() => setEditingId(d.id)}
                          >
                            {d.title}
                          </button>
                          <span className="li-s">
                            {DOCUMENT_TYPE_LABEL[d.type]}, {formatLabel(d)}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td>
                      <Badge tone={audienceTone(d.audience.kind)}>{audienceLabel(d.audience)}</Badge>
                    </td>
                    <td className="tnum r t-sec">{adminUpdatedLabel(d.updatedAt, today)}</td>
                    <td className="tnum r">{d.opens ?? 0}</td>
                    <td className="tnum r t-sec">{d.partnerCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 ? (
              <div className="empty">No documents yet. Upload the first one.</div>
            ) : null}
          </div>
        </section>
      </div>

      {editing ? (
        <DocumentEditDrawer
          key={editing.id}
          doc={editing}
          partners={partners}
          today={today}
          onClose={closeEdit}
        />
      ) : null}
    </div>
  );
}
