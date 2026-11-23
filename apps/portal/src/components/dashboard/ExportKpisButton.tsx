"use client";

import { downloadCsv } from "@/components/partners/csv";

/** Downloads the KPI table the page already shows, filters and all; nothing is fetched. */
export function ExportKpisButton({
  filename,
  header,
  rows,
}: {
  filename: string;
  header: readonly string[];
  rows: readonly (readonly string[])[];
}): React.JSX.Element {
  return (
    <button type="button" className="btn btn-s" onClick={() => downloadCsv(filename, header, rows.map((r) => [...r]))}>
      Download KPIs
    </button>
  );
}
