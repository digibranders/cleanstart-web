export function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="wrap" role="status" aria-label="Loading">
      <div className="head">
        <div className="skel" style={{ height: 22, width: 160 }} />
        <div className="skel" style={{ height: 30, width: 120, borderRadius: 7 }} />
      </div>
      <div className="card clip">
        <div className="kpis">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi">
              <div className="skel" style={{ height: 12, width: 90 }} />
              <div className="skel" style={{ height: 22, width: 48 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 12, display: "grid", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skel" style={{ height: 28 }} />
        ))}
      </div>
    </div>
  );
}
