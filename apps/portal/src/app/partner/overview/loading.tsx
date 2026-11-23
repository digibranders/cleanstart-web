export default function Loading(): React.JSX.Element {
  return (
    <div className="wrap" role="status" aria-label="Loading">
      <div className="head">
        <div className="skel" style={{ height: 22, width: 160 }} />
        <div className="skel" style={{ height: 30, width: 320, borderRadius: 7 }} />
      </div>
      <div className="card clip">
        <div className="kpis dash-kpis">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="kt" style={{ padding: "10px 14px", gap: 6 }}>
              <div className="skel" style={{ height: 12, width: 90 }} />
              <div className="skel" style={{ height: 22, width: 56 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="dash">
        {[4, 4, 4, 8, 4].map((span, i) => (
          <div key={i} className={`card dash-c${span}${span === 8 ? " dash-wide" : ""}`} style={{ display: "grid", gap: 10, alignContent: "start", padding: 12 }}>
            <div className="skel" style={{ height: 14, width: 140 }} />
            <div className="skel" style={{ height: 150 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
