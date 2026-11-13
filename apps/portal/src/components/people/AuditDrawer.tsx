import { Drawer } from '@/components/ui/overlay';
import { fullTimestamp } from '@/lib/audit-csv';
import { EVENT_SOURCE_LABEL } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';

export function AuditDrawer({
  entry,
  onClose,
}: {
  entry: AuditEntryDto | null;
  onClose: () => void;
}): React.JSX.Element | null {
  if (!entry) return null;
  return (
    <Drawer
      open
      onClose={onClose}
      title={entry.action}
      subtitle={entry.target}
      footer={
        <button type="button" className="btn btn-s" onClick={onClose}>
          Close
        </button>
      }
    >
      <dl className="dl">
        <dt>When</dt>
        <dd>{fullTimestamp(entry.at)}</dd>
        <dt>Who</dt>
        <dd>{entry.actorLabel}</dd>
        <dt>Role</dt>
        <dd>{entry.actorRole ?? ''}</dd>
        <dt>Action</dt>
        <dd>{entry.action}</dd>
        <dt>On</dt>
        <dd>{entry.target}</dd>
        <dt>Source</dt>
        <dd>{EVENT_SOURCE_LABEL[entry.source]}</dd>
      </dl>
      {entry.before ? (
        <div className="fg">
          <span className="lbl">Change</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="note" style={{ background: '#FDF3F3', color: '#8A1717', border: '1px solid #F5D9D9' }}>
              <span>
                <b>Before</b>
                <br />
                {entry.before}
              </span>
            </div>
            <div className="note" style={{ background: '#EFF8F2', color: '#17663A', border: '1px solid #CDEAD7' }}>
              <span>
                <b>After</b>
                <br />
                {entry.after ?? ''}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {entry.note ? (
        <div className="fg">
          <span className="lbl">Details</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>{entry.note}</p>
        </div>
      ) : null}
    </Drawer>
  );
}
