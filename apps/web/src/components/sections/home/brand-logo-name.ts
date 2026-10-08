const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "iifl-finance": "IIFL Finance",
  "5paisa": "5paisa",
  kpmg: "KPMG",
  o9: "o9 Solutions",
  vi: "Vi",
  "63moons": "63 moons",
  iftas: "IFTAS",
};

/**
 * Company name for a `/images/trusted/*` logo file, used as its alt text.
 * "03-iifl-finance.webp" -> "IIFL Finance", "mahindra-red-logo.webp" -> "Mahindra".
 * Acronyms and odd spellings live in DISPLAY_NAMES; anything else is title-cased
 * from the file name, so a newly dropped-in logo still gets a sensible alt.
 */
export function brandLogoName(file: string): string {
  const stem = file
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+-/, "")
    .replace(/^logo-/, "")
    .replace(/-(red-)?logo$/, "");
  const known = DISPLAY_NAMES[stem];
  if (known) return known;
  return stem
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
