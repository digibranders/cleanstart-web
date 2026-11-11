import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { FOLLOW_UPS } from '@/data/reports';
import { avatarClass, initialsOf } from './partner-ui';

export function FollowUpList(): React.JSX.Element {
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
        <span className="card-meta">{FOLLOW_UPS.length}</span>
      </div>
      {FOLLOW_UPS.map((f, i) => (
        <Link key={f.name} href={ROUTES.admin.partners} className="li">
          <span className={`av ${avatarClass(i + 2)}`}>{initialsOf(f.name)}</span>
          <span className="li-t">
            <span className="li-n">{f.name}</span>
            <span className="li-s">{f.why}</span>
          </span>
          <span
            className={`badge ${f.status === 'Inactive' ? 'b-expired' : 'b-pending'}`}
            style={{ marginLeft: 'auto' }}
          >
            {f.status}
          </span>
        </Link>
      ))}
    </section>
  );
}
