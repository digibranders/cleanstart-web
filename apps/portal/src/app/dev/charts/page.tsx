import { notFound } from "next/navigation";
import { BarList, Bullet, Columns, Donut, Funnel, Heatmap, Line, PRODUCT_COLOR, StatTile, Timeline } from "@/components/charts";
import type { HeatWeek, ProtectionBar } from "@/components/charts";
import { isDemoMode } from "@/server/demo";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const TODAY = Date.UTC(2026, 10, 23);
const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const IMAGES = [4, 6, 5, 8, 9, 7, 11, 12, 10, 14, 13, 16];
const LIBS = [2, 3, 3, 4, 4, 6, 5, 7, 8, 7, 9, 10];
const SIGHT = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 8];

const WEEKS: HeatWeek[] = Array.from({ length: 12 }, (_, w) => ({
  label: `Wk ${w + 1}`,
  days: Array.from({ length: 7 }, (_, d) => (d > 4 ? (w + d) % 3 : ((w * 5 + d * 3) % 9) + (w % 4 === 0 ? 0 : 1))),
}));

const WINDOWS: ProtectionBar[] = [
  { key: "a", label: "Northwind Bank", start: TODAY - 120 * DAY, end: TODAY + 60 * DAY, state: "active" },
  { key: "b", label: "Contoso Health", start: TODAY - 170 * DAY, end: TODAY + 10 * DAY, state: "expiring" },
  { key: "c", label: "Fabrikam Retail", start: TODAY - 260 * DAY, end: TODAY - 20 * DAY, state: "expired" },
  { key: "d", label: "Tailspin Telecom", start: TODAY - 30 * DAY, end: TODAY + 150 * DAY, state: "active" },
];

const sum = (a: number[]): number => a.reduce((n, v) => n + v, 0);

/** Dev only review page for the chart components. 404 in production and in demo mode. */
export default function ChartGallery(): React.JSX.Element {
  if (process.env.NODE_ENV === "production" || isDemoMode()) notFound();
  return (
    <main className="ch-gallery">
      <h1>Chart components</h1>
      <div className="kpis">
        <StatTile label="Deals registered" value="128" delta={{ change: 0.124, versus: "vs prior 90 days" }} trend={IMAGES} />
        <StatTile label="Win rate" value="34%" delta={{ change: -0.05, versus: "vs prior 90 days" }} trend={LIBS} />
        <StatTile label="Avg days to accept" value="3.2" delta={{ change: -0.18, versus: "vs prior 90 days", upIsGood: false }} />
        <StatTile label="Pipeline" value="$2.4M" size="hero" />
      </div>
      <Donut
        title="Deals by product"
        description="Share of registered deals in the last 90 days by product."
        totalLabel="deals"
        data={[
          { key: "i", label: "CleanStart Images", value: sum(IMAGES), color: PRODUCT_COLOR["CleanStart Images"] },
          { key: "l", label: "Clean Libraries", value: sum(LIBS), color: PRODUCT_COLOR["Clean Libraries"] },
          { key: "s", label: "CleanSight", value: sum(SIGHT), color: PRODUCT_COLOR.CleanSight },
        ]}
      />
      <BarList
        title="Top partners by registered deals"
        description="Ranked, last 90 days."
        data={[
          { key: "1", label: "Acme Cloud Services", value: 42 },
          { key: "2", label: "Globex Integrators", value: 31 },
          { key: "3", label: "Initech Partners", value: 24 },
          { key: "4", label: "Umbrella Security Consulting Group", value: 17 },
          { key: "5", label: "Hooli Reseller", value: 9 },
        ]}
      />
      <Columns
        title="Registrations per month"
        description="Deals registered in each of the last 12 months."
        series={[{ key: "n", label: "Deals" }]}
        rows={MONTHS.map((label, i) => ({ label, values: [(IMAGES[i] ?? 0) + (LIBS[i] ?? 0) + (SIGHT[i] ?? 0)] }))}
      />
      <Columns
        title="Registrations by product"
        description="Deals registered per month, stacked by product."
        stacked
        series={[
          { key: "i", label: "CleanStart Images", color: PRODUCT_COLOR["CleanStart Images"] },
          { key: "l", label: "Clean Libraries", color: PRODUCT_COLOR["Clean Libraries"] },
          { key: "s", label: "CleanSight", color: PRODUCT_COLOR.CleanSight },
        ]}
        rows={MONTHS.map((label, i) => ({ label, values: [IMAGES[i] ?? 0, LIBS[i] ?? 0, SIGHT[i] ?? 0] }))}
      />
      <Line
        title="Accepted deals"
        description="Accepted deals per month by product."
        labels={MONTHS}
        withArea
        series={[
          { key: "i", label: "CleanStart Images", color: PRODUCT_COLOR["CleanStart Images"], values: IMAGES },
          { key: "l", label: "Clean Libraries", color: PRODUCT_COLOR["Clean Libraries"], values: LIBS },
        ]}
      />
      <Funnel
        title="Deal funnel"
        description="Deals at each stage and conversion from the stage above."
        stages={[
          { label: "Registered", value: 128 },
          { label: "Accepted", value: 97 },
          { label: "Qualified", value: 64 },
          { label: "Won", value: 33 },
        ]}
      />
      <Heatmap title="Activity by day" description="Registrations per weekday across the last 12 weeks." weeks={WEEKS} unit="deals" />
      <Timeline title="Protection windows" description="Each deal's protection period; the line marks today." bars={WINDOWS} today={TODAY} />
      <Bullet
        title="Quarter target"
        description="Registered value against target, by partner."
        format={(n) => `$${n}K`}
        rows={[
          { key: "a", label: "Acme Cloud Services", value: 420, target: 500 },
          { key: "b", label: "Globex Integrators", value: 610, target: 500 },
          { key: "c", label: "Initech Partners", value: 150, target: 300 },
        ]}
      />
    </main>
  );
}
