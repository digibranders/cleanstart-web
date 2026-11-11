import { ProductChip } from '@/components/ui/badge';
import { PRODUCT_ROWS, TOTAL_REGISTERED } from '@/data/reports';

export function ProductBreakdown(): React.JSX.Element {
  return (
    <section aria-labelledby="bp" className="card clip" style={{ flex: '1 1 520px', minWidth: 0 }}>
      <div className="card-h">
        <h2 id="bp" className="card-t">
          By product
        </h2>
        <span className="card-meta">Registered this quarter</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col" className="r">
              Registered
            </th>
            <th scope="col" className="r">
              Accepted
            </th>
            <th scope="col" className="r">
              Won
            </th>
            <th scope="col" style={{ width: '34%' }}>
              Share of registrations
            </th>
          </tr>
        </thead>
        <tbody>
          {PRODUCT_ROWS.map((b) => {
            const share = Math.round((b.registered / TOTAL_REGISTERED) * 100);
            return (
              <tr key={b.product}>
                <td>
                  <ProductChip product={b.product} />
                </td>
                <td className="tnum r">{b.registered}</td>
                <td className="tnum r">{b.accepted}</td>
                <td className="tnum r">{b.won}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="bar" style={{ flex: 1 }}>
                      <span style={{ width: `${share}%` }} />
                    </span>
                    <span className="tnum t-sec" style={{ width: 34, textAlign: 'right' }}>
                      {share}%
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
