import { EDITION_LABEL, PAGE_COUNT, type ProgramReviewDto } from '@/lib/program-review';
import './program-review.css';

const TITLE = 'Partner Program Review';

function Page({
  label,
  n,
  dto,
  title,
  children,
}: {
  label: string;
  n: number;
  dto: ProgramReviewDto;
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="pr-page" aria-label={label}>
      <div className="pr-inner">
        <div className="pr-run">
          <span>{TITLE}</span>
          <span>
            {dto.period}, {dto.scope}
          </span>
        </div>
        <h2 className="pr-pt">{title}</h2>
        {children}
      </div>
      <div className="pr-foot">
        <span>CleanStart Partner Portal</span>
        <span>
          Page {n} of {PAGE_COUNT}
        </span>
      </div>
    </section>
  );
}

function Legend({ items }: { items: Array<{ color: string; label: string }> }): React.JSX.Element {
  return (
    <div className="pr-legend">
      {items.map((i) => (
        <span key={i.label}>
          <s style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function CoverPage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  return (
    <section className="pr-page pr-cover" aria-label="Cover">
      <div className="pr-inner">
        <div className="pr-top">
          <div className="pr-brand">
            <svg width="22" height="25" viewBox="0 0 27.8 32" aria-hidden="true">
              <defs>
                <linearGradient
                  id="pr-mk"
                  x1="12.39"
                  y1="20.14"
                  x2="27.87"
                  y2="20.51"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#9A51FF" />
                  <stop offset="1" stopColor="#2CC1EB" />
                </linearGradient>
              </defs>
              <path
                d="M24.2359 10.3234V22.0554L15.709 27.1983V15.2722L12.3945 17.1973L12.4877 17.2505V31.1486L13.898 31.9969L27.7958 23.8114V8.32319L27.7368 8.28876L24.2359 10.3234Z"
                fill="url(#pr-mk)"
              />
              <path
                d="M15.7088 15.219L5.10062 8.92732L14.0283 3.991L24.2326 9.87577V10.3203L27.7335 8.28563L13.8295 0L0 8.32006V23.6079L3.22439 25.5518V11.7695L12.3943 17.1942L15.7088 15.2691V15.219Z"
                fill="#fff"
              />
            </svg>
            <span>
              CleanStart <small>Partner Portal</small>
            </span>
          </div>
          <span className="pr-tag">{EDITION_LABEL[dto.edition]}</span>
        </div>
        <h1 className="pr-title">{TITLE}</h1>
        <p className="pr-per">{dto.period}</p>
        <p className="pr-scope">{dto.scopeLine}</p>

        <div
          className="pr-art"
          role="img"
          aria-label={`Deals registered, approved and won this period: ${dto.cover.map((b) => b.value).join(', ')}`}
        >
          {dto.cover.map((b) => (
            <div className="pr-art-row" key={b.label}>
              <div className="pr-art-bar" style={{ width: `${b.width}%`, background: b.color }} />
              <div>
                <div className="pr-fig">{b.value}</div>
                <div className="pr-lab">{b.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="pr-coverfoot">
          <div>
            <b>Prepared by {dto.preparedBy}</b>
            {dto.preparerRole}
          </div>
          <div>
            <b>Generated</b>
            {dto.generated}
          </div>
          <div>
            <b>Confidential</b>
            {dto.edition === 'shareable'
              ? 'Partner names and contacts removed'
              : 'For CleanStart internal use'}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SummaryPage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  const { summary } = dto;
  return (
    <Page label="Summary" n={2} dto={dto} title="Summary">
      <p className="pr-headline">{summary.headline}</p>
      <div className="pr-kpis" role="list">
        {summary.kpis.map((k) => (
          <div className="pr-kpi" role="listitem" key={k.label}>
            <div className="pr-kl">{k.label}</div>
            <div className={`pr-kv${k.value === 'None yet' ? ' pr-kv-s' : ''}`}>{k.value}</div>
            <div className="pr-kd">{k.delta}</div>
            <div className="pr-pair" aria-hidden="true">
              <i className="pr-pa" style={{ width: `${k.priorWidth}%` }} />
              <i className="pr-pb" style={{ width: `${k.currentWidth}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Legend
        items={[
          { color: 'var(--prior)', label: `Last period, ${dto.priorPeriod}` },
          { color: 'var(--violet)', label: 'This period' },
        ]}
      />
      {summary.valueNote ? <p className="pr-note">{summary.valueNote}</p> : null}

      <div className="pr-block">
        <h3 className="pr-h">What changed</h3>
        <dl className="pr-find">
          {summary.changes.map((c) => (
            <div key={c.label} style={{ display: 'contents' }}>
              <dt>{c.label}</dt>
              <dd>
                <b>{c.lead}</b> {c.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="pr-block">
        <div className="pr-attn">
          <h3 className="pr-h">Needs attention</h3>
          <ol>
            {summary.attention.map((a) => (
              <li key={a.lead}>
                <b>{a.lead}</b> {a.detail}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Page>
  );
}

export function PipelinePage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  const { pipeline: p } = dto;
  return (
    <Page label="Pipeline" n={3} dto={dto} title="Pipeline">
      <p className="pr-lede">{p.lede}</p>
      <div className="pr-two">
        <div>
          <h3 className="pr-h">Funnel, this period against last</h3>
          <div className="pr-fun">
            {p.funnel.map((f) => (
              <FunnelRow key={f.label} row={f} />
            ))}
          </div>
          <Legend
            items={[
              { color: 'var(--violet-d)', label: 'This period' },
              { color: 'var(--prior)', label: p.priorLegend },
            ]}
          />
        </div>
        <div>
          <h3 className="pr-h">Where the {dto.deals} deals stand</h3>
          <div
            className="pr-stack"
            role="img"
            aria-label={p.stack.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(', ')}
          >
            {p.stack.map((s) => (
              <i key={s.tone} className={`pr-t-${s.tone}`} style={{ width: `${s.width}%` }} />
            ))}
          </div>
          <div className="pr-stk">
            {p.stack.map((s) => (
              <div key={s.tone}>
                <span className="k">
                  <span className={`pr-sw pr-t-${s.tone}`} />
                  {s.label}
                </span>
                <b>{s.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pr-block">
        <h3 className="pr-h">How each product's deals ended up</h3>
        <div
          className="pr-ps"
          role="img"
          aria-label={p.products
            .map((x) => `${x.product}: ${x.won} won, ${x.deals - x.approved} not approved`)
            .join('. ')}
        >
          {p.products.map((x) => (
            <ProductBar key={x.product} row={x} />
          ))}
        </div>
        <Legend
          items={[
            { color: 'var(--won)', label: 'Won' },
            { color: 'var(--accepted)', label: 'Approved, not won' },
            { color: '#D9D7E2', label: 'Not approved: waiting or rejected' },
          ]}
        />
      </div>

      <div className="pr-block">
        <h3 className="pr-h">By product</h3>
        <table className="pr-tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th className="r">Deals</th>
              <th className="r">Approved</th>
              <th className="r">Won</th>
              <th className="r">Won value</th>
              <th style={{ width: '44mm' }}>Registered value</th>
            </tr>
          </thead>
          <tbody>
            {p.products.map((x) => (
              <tr key={x.product}>
                <td>
                  <span className="pr-sw" style={{ background: x.swatch }} />
                  {x.product}
                </td>
                <td className="r">{x.deals}</td>
                <td className="r">
                  {x.approved}{' '}
                  {x.approvedShare ? <span className="pr-muted">({x.approvedShare})</span> : null}
                </td>
                <td className="r">{x.won}</td>
                <td className="r">{x.wonValue}</td>
                <td>
                  <span
                    className="pr-mini"
                    style={{ width: `${x.valueWidth}%`, background: '#DDD3F8' }}
                  >
                    <i style={{ width: `${x.wonFill}%`, background: x.swatch }} />
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{x.totalValue}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>All products</td>
              <td className="r">{p.totals.deals}</td>
              <td className="r">{p.totals.approved}</td>
              <td className="r">{p.totals.won}</td>
              <td className="r">{p.totals.wonValue}</td>
              <td>{p.totals.totalValue}</td>
            </tr>
          </tfoot>
        </table>
        {p.note ? <p className="pr-note">{p.note}</p> : null}
      </div>
    </Page>
  );
}

function FunnelRow({
  row,
}: { row: ProgramReviewDto['pipeline']['funnel'][number] }): React.JSX.Element {
  return (
    <>
      <div className="pr-name">
        {row.label}
        <span>{row.sub}</span>
      </div>
      <div>
        <div className="pr-fb" style={{ width: `${row.width}%`, background: row.color }}>
          {row.value}
        </div>
        <div className="pr-fp" style={{ width: `${row.priorWidth}%` }} />
      </div>
    </>
  );
}

function ProductBar({
  row,
}: { row: ProgramReviewDto['pipeline']['products'][number] }): React.JSX.Element {
  return (
    <>
      <div className="pr-name">
        {row.product}
        <span>{row.deals} deals</span>
      </div>
      <div className="pr-sg" style={{ width: `${row.barWidth}%` }}>
        {row.wonSeg > 0 ? (
          <i className="pr-t-won" style={{ width: `${row.wonSeg}%` }}>
            {row.won}
          </i>
        ) : null}
        {row.openSeg > 0 ? (
          <i className="pr-t-accepted" style={{ width: `${row.openSeg}%` }}>
            {row.approved - row.won}
          </i>
        ) : null}
        {row.restSeg > 0 ? (
          <i className="rest" style={{ width: `${row.restSeg}%` }}>
            {row.deals - row.approved}
          </i>
        ) : null}
      </div>
    </>
  );
}

export function PartnersPage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  const { partners: p } = dto;
  return (
    <Page label="Partners" n={4} dto={dto} title="Partners">
      <p className="pr-lede">{p.lede}</p>
      {p.stat ? (
        <div className="pr-stat">
          <div className="pr-big">{p.stat.big}</div>
          <p>
            {p.stat.before}
            <b>{p.stat.name}</b>
            {p.stat.after}
          </p>
        </div>
      ) : null}

      <div className="pr-block">
        <h3 className="pr-h">Leaderboard</h3>
        <table className="pr-tbl pr-tight">
          <thead>
            <tr>
              <th>Partner</th>
              <th className="r">Deals</th>
              <th style={{ width: '34mm' }} />
              <th className="r">Won</th>
              <th className="r">Won value</th>
            </tr>
          </thead>
          <tbody>
            {p.leaderboard.map((r) => (
              <tr key={r.name}>
                <td>
                  <div className="pr-clip">{r.name}</div>
                </td>
                <td className="r">{r.deals}</td>
                <td>
                  <span
                    className="pr-mini"
                    style={{ width: `${r.width}%`, background: 'var(--violet)' }}
                  />
                </td>
                <td className="r">{r.won}</td>
                <td className="r">{r.wonValue}</td>
              </tr>
            ))}
            {p.leaderboard.length === 0 ? (
              <tr>
                <td colSpan={5} className="pr-sec">
                  No partner registered a deal in this period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {p.leaderboardMore > 0 ? (
          <p className="pr-note">
            {p.leaderboardMore} more {p.leaderboardMore === 1 ? 'partner is' : 'partners are'} in
            the portal.
          </p>
        ) : null}
      </div>

      {p.managers && p.managers.length > 0 ? (
        <div className="pr-block">
          <h3 className="pr-h">By partner manager</h3>
          <table className="pr-tbl pr-tight">
            <thead>
              <tr>
                <th>Manager</th>
                <th className="r">Deals</th>
                <th className="r">Won value</th>
                <th className="r">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {p.managers.map((m) => (
                <tr key={m.name}>
                  <td>
                    {m.name} {m.detail ? <span className="pr-muted">{m.detail}</span> : null}
                  </td>
                  <td className="r">{m.deals}</td>
                  <td className="r">{m.wonValue}</td>
                  <td className="r">{m.winRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="pr-block">
        <h3 className="pr-h">All time, to {dto.period.split(' to ')[1]}</h3>
        <table className="pr-tbl pr-tight">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Category</th>
              <th className="r">Registered</th>
              <th className="r">Accepted</th>
              <th className="r">Accept rate</th>
              <th className="r">Won</th>
              <th className="r">Protected now</th>
            </tr>
          </thead>
          <tbody>
            {p.allTime.map((r) => (
              <tr key={r.name}>
                <td>
                  <div className="pr-clip">{r.name}</div>
                </td>
                <td className="pr-sec">{r.category}</td>
                <td className="r">{r.registered}</td>
                <td className="r">{r.accepted}</td>
                <td className={`r${r.rate === 'None yet' ? ' pr-muted' : ''}`}>{r.rate}</td>
                <td className="r">{r.won}</td>
                <td className="r">{r.protectedNow}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>All partners</td>
              <td />
              <td className="r">{p.allTimeTotals.registered}</td>
              <td className="r">{p.allTimeTotals.accepted}</td>
              <td className="r">{p.allTimeTotals.rate}</td>
              <td className="r">{p.allTimeTotals.won}</td>
              <td className="r">{p.allTimeTotals.protectedNow}</td>
            </tr>
          </tfoot>
        </table>
        {p.allTimeMore > 0 ? (
          <p className="pr-note">
            {p.allTimeMore} more {p.allTimeMore === 1 ? 'partner is' : 'partners are'} included in
            the totals and listed in the portal.
          </p>
        ) : null}
      </div>
    </Page>
  );
}

function HBars({
  rows,
  tone,
}: {
  rows: Array<{ label: string; count: number; width: number }>;
  tone: string;
}): React.JSX.Element {
  return (
    <div className="pr-hb">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="pr-r1">
            <span>{r.label}</span>
            <b>{r.count}</b>
          </div>
          <div className="pr-hb-t" style={{ width: `${r.width}%`, background: tone }} />
        </div>
      ))}
    </div>
  );
}

export function DecisionsPage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  const { decisions: d } = dto;
  const hasBars = d.bars.some((b) => b.current !== null);
  return (
    <Page label="Decisions and quality" n={5} dto={dto} title="Decisions and quality">
      <p className="pr-lede">{d.lede}</p>

      <div className="pr-grow">
        <h3 className="pr-h">Time to first decision, in days</h3>
        {hasBars ? (
          <>
            <div
              className="pr-ttw"
              role="img"
              aria-label={d.bars
                .map((b) => `${b.label} ${b.current ?? 'none'} days against ${b.prior ?? 'none'}`)
                .join('. ')}
            >
              <div className="pr-tt">
                {d.bars.map((b) => (
                  <DecisionRow key={b.label} bar={b} />
                ))}
              </div>
              <div className="pr-tov" aria-hidden="true">
                <span className="pr-target" style={{ left: `${d.targetLeft}%` }} />
                <span className="pr-tlab" style={{ left: `${d.targetLeft}%` }}>
                  Review target
                </span>
              </div>
            </div>
            <Legend
              items={[
                { color: 'var(--violet)', label: 'This period' },
                { color: 'var(--prior)', label: d.priorLegend },
              ]}
            />
            <p className="pr-note">
              Bars count calendar days from registration, or from resubmission after a rejection.
              The review target counts business days.
            </p>
          </>
        ) : (
          <p className="pr-sec">No deal has had a first decision yet.</p>
        )}
      </div>

      <div className="pr-cols pr-block">
        <div>
          <h3 className="pr-h">Why deals were rejected</h3>
          <p className="pr-cap">{d.rejected.summary}</p>
          {d.rejected.reasons ? <HBars rows={d.rejected.reasons} tone="var(--rejected)" /> : null}
        </div>
        <div>
          <h3 className="pr-h">Document engagement</h3>
          <p className="pr-cap">{d.engagement.summary}</p>
          {d.engagement.documents.length > 0 ? (
            <>
              <HBars rows={d.engagement.documents} tone="var(--violet)" />
              <p className="pr-note">Figures are opens in the period.</p>
            </>
          ) : null}
        </div>
      </div>

      {d.followUps ? (
        <div className="pr-block">
          <h3 className="pr-h">Partners to follow up</h3>
          <table className="pr-tbl">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.followUps.map((f) => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td className="pr-sec">{f.why}</td>
                  <td>{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Page>
  );
}

function DecisionRow({
  bar,
}: { bar: ProgramReviewDto['decisions']['bars'][number] }): React.JSX.Element {
  return (
    <>
      <div className="pr-name">
        {bar.label}
        <span>{bar.sub}</span>
      </div>
      <div className="pr-tr">
        {bar.prior !== null ? (
          <i className="a" style={{ width: `${bar.priorWidth}%` }}>
            {bar.prior}
          </i>
        ) : null}
        {bar.current !== null ? (
          <i className="b" style={{ width: `${bar.currentWidth}%` }}>
            {bar.current}
          </i>
        ) : (
          <span className="pr-muted">None yet</span>
        )}
      </div>
    </>
  );
}

export function MethodPage({ dto }: { dto: ProgramReviewDto }): React.JSX.Element {
  const { method: m } = dto;
  return (
    <Page label="Method and definitions" n={6} dto={dto} title="Method and definitions">
      <p className="pr-lede">
        How the figures were produced, so any number in this report can be checked in the portal.
      </p>
      <dl className="pr-def">
        {m.definitions.map((d) => (
          <div key={d.term} style={{ display: 'contents' }}>
            <dt>{d.term}</dt>
            <dd>{d.text}</dd>
          </div>
        ))}
      </dl>
      <div className="pr-block">
        <div className="pr-about">
          {m.about.map((a) => (
            <div key={a.label}>
              <b>{a.label}</b>
              {a.value}
            </div>
          ))}
        </div>
      </div>
      <div className="pr-block">
        <h3 className="pr-h">Reading notes</h3>
        <p className="pr-sec" style={{ margin: 0, maxWidth: '160mm' }}>
          {m.reading}
        </p>
      </div>
    </Page>
  );
}

/** The six pages in order. */
export function ProgramReviewDocument({
  dto,
  toolbar,
}: { dto: ProgramReviewDto; toolbar?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="pr">
      {toolbar}
      <main className="pr-sheet">
        <CoverPage dto={dto} />
        <SummaryPage dto={dto} />
        <PipelinePage dto={dto} />
        <PartnersPage dto={dto} />
        <DecisionsPage dto={dto} />
        <MethodPage dto={dto} />
      </main>
    </div>
  );
}
