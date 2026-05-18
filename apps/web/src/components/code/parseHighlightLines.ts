export function parseHighlightLines(input: string | null | undefined): Set<number> {
  const out = new Set<number>();
  if (!input) return out;
  for (const raw of input.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range?.[1] && range[2]) {
      const start = Math.max(1, Number.parseInt(range[1], 10));
      const end = Math.max(start, Number.parseInt(range[2], 10));
      for (let n = start; n <= end; n += 1) out.add(n);
      continue;
    }
    const single = Number.parseInt(part, 10);
    if (Number.isFinite(single) && single > 0) out.add(single);
  }
  return out;
}
