/** `list` is a title, a KPI strip and rows (Overview, Deals); `form` is a title and stacked labelled fields with no KPI strip (Account, Company, Register deal). */
export function LoadingSkeleton({ variant = "list" }: { variant?: "list" | "form" }): React.JSX.Element {
  return (
    <div className="wrap" role="status" aria-label="Loading">
      <div className="head">
        <div className="skel" style={{ height: 22, width: 160 }} />
        {variant === "list" ? <div className="skel" style={{ height: 30, width: 120, borderRadius: 7 }} /> : null}
      </div>
      {variant === "list" ? (
        <>
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
        </>
      ) : (
        <div className="card" style={{ padding: 16, display: "grid", gap: 16, maxWidth: 720 }}>
          <div className="skel" style={{ height: 16, width: 140 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "grid", gap: 6 }}>
              <div className="skel" style={{ height: 12, width: 96 }} />
              <div className="skel" style={{ height: 34 }} />
            </div>
          ))}
          <div className="skel" style={{ height: 30, width: 96, borderRadius: 7 }} />
        </div>
      )}
    </div>
  );
}
