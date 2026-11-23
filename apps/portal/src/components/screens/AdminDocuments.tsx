'use client';

import { useCallback, useState } from 'react';
import { Icon } from '@/components/icon';
import { DocumentEditDrawer } from '@/components/documents/DocumentEditDrawer';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { UploadDocumentForm } from '@/components/documents/UploadDocumentForm';
import { CHIP_PRODUCT, TYPE_ICON, TYPE_TONE } from '@/components/documents/doc-style';
import { adminUpdatedLabel, audienceTone } from '@/components/documents/doc-view';
import { ActionMenu } from '@/components/ui/action-menu';
import { Badge, ProductChip } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import type { AudiencePartnerDto } from '@/lib/document-upload';
import { plural } from '@/lib/dates';
import { DOCUMENT_TYPE_LABEL } from '@/lib/domain';
import type { DocumentDto } from '@/lib/dto';
import { audienceLabel, formatLabel } from '@/server/files/rules';
import { ScrollRegion } from "@/components/ui/scroll-region";

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
  const [viewingId, setViewingId] = useState<string | null>(null);
  const toast = useToast();
  const closeUpload = useCallback((): void => setUploadOpen(false), []);
  const closeEdit = useCallback((): void => setEditingId(null), []);
  const closeView = useCallback((): void => setViewingId(null), []);

  const opensTotal = docs.reduce((n, d) => n + (d.opens ?? 0), 0);
  const editing = editingId ? (docs.find((d) => d.id === editingId) ?? null) : null;
  const viewing = viewingId ? (docs.find((d) => d.id === viewingId) ?? null) : null;

  // The file route checks the audience and redirects to a 60 second signed URL. Staff opens are not counted.
  const download = (d: DocumentDto): void => {
    const link = document.createElement('a');
    link.href = `/api/files/${d.id}`;
    link.download = '';
    document.body.append(link);
    link.click();
    link.remove();
    toast(`Downloading ${d.title}, ${formatLabel(d)}`);
  };
  const openDocument = (d: DocumentDto): void => {
    if (d.type === 'video') setViewingId(d.id);
    else window.open(`/api/files/${d.id}`, '_blank', 'noopener');
  };

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
          <ScrollRegion label="Document library">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col" className="hide-sm">
                    Product
                  </th>
                  <th scope="col">Who can open it</th>
                  <th scope="col" className="r hide-sm">
                    Updated
                  </th>
                  <th scope="col" className="r">
                    Opens
                  </th>
                  <th scope="col" className="r hide-sm">
                    Opened by
                  </th>
                  <th scope="col" className="r">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: 'normal', minWidth: 150 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`li-ic ${TYPE_TONE[d.type]}`}>
                          <Icon name={TYPE_ICON[d.type]} />
                        </span>
                        <span className="li-t">
                          <button
                            type="button"
                            className="linkbtn li-n"
                            style={{ fontSize: 13 }}
                            onClick={() => openDocument(d)}
                          >
                            {d.title}
                          </button>
                          <span className="li-s">
                            {DOCUMENT_TYPE_LABEL[d.type]}, {formatLabel(d)}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="hide-sm">
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td>
                      <Badge tone={audienceTone(d.audience.kind)}>{audienceLabel(d.audience)}</Badge>
                    </td>
                    <td className="tnum r t-sec hide-sm">{adminUpdatedLabel(d.updatedAt, today)}</td>
                    <td className="tnum r">{d.opens ?? 0}</td>
                    <td className="tnum r t-sec hide-sm">{plural(d.partnerCount ?? 0, 'partner')}</td>
                    <td className="r">
                      <ActionMenu
                        label="Actions"
                        ariaLabel={`Actions for ${d.title}`}
                        items={[
                          { label: d.type === 'video' ? 'Watch' : 'Open', onSelect: () => openDocument(d) },
                          { label: 'Download', onSelect: () => download(d) },
                          { label: 'Edit', onSelect: () => setEditingId(d.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 ? (
              <div className="empty">No documents yet. Upload the first one.</div>
            ) : null}
          </ScrollRegion>
        </section>
      </div>

      <DocumentPreview doc={viewing} onClose={closeView} onDownload={download} />

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
