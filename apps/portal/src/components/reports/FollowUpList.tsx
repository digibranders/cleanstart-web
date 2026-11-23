import Link from 'next/link';
import type { FollowUpDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { avatarClass, initialsOf } from './partner-ui';

export function FollowUpList({ items }: { items: FollowUpDto[] }): React.JSX.Element {
  return (
    <section
      aria-labelledby="fu"
      className="card clip"
      style={{ flex: '1 1 380px', minWidth: 300 }}
    >
      <div className="card-h">
        <h2 id="fu" className="card-t">
          Partners to follow up
        </h2>
        <span className="card-meta">{items.length}</span>
      </div>
      {items.length === 0 ? <div className="empty">No partners need a follow-up right now.</div> : null}
      {items.map((f, i) => (
        <Link key={f.partnerId} href={`${ROUTES.admin.partners}?selected=${f.partnerId}`} className="li">
          <span className={`av ${avatarClass(i + 2)}`}>{initialsOf(f.name)}</span>
          <span className="li-t">
            <span className="li-n">{f.name}</span>
            <span className="li-s">{f.why}</span>
          </span>
          <span
            className={`badge ${f.status === 'inactive' ? 'b-expired' : 'b-pending'}`}
            style={{ marginLeft: 'auto' }}
          >
            {f.status === 'inactive' ? 'Inactive' : 'Onboarding'}
          </span>
        </Link>
      ))}
    </section>
  );
}
