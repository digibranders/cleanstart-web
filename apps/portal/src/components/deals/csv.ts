function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Builds a CSV from rows of strings and hands it to the browser as a download. */
export function downloadCsv(filename: string, rows: readonly (readonly string[])[]): void {
  const body = rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
