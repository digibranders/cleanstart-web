import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, e.g. "IN". Also what the lead record stores. */
  code: CountryCode;
  /** Localised country name, e.g. "India". */
  name: string;
  /** Dial code without the plus, e.g. "91". */
  callingCode: string;
  /** Regional-indicator pair, e.g. "🇮🇳". */
  flag: string;
}

/**
 * Regional indicator symbols sit at U+1F1E6 for "A", 0x41 code points above
 * ASCII "A", so an ISO code maps to its flag with pure arithmetic. Beats
 * shipping 250 flag images or an emoji lookup table.
 */
const flagFor = (code: string): string =>
  String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

/**
 * Country names come from Intl.DisplayNames, which every browser we support
 * has had since 2021. It costs nothing in bundle size and gives us the CLDR
 * names rather than a hand-maintained list that would drift.
 */
const displayNames = (): Intl.DisplayNames | null => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
};

/**
 * Every country libphonenumber-js can parse a number for, sorted by name.
 * Built once per session: getCountries() walks the full metadata table, and
 * the result never changes.
 */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = (() => {
  const names = displayNames();
  return getCountries()
    .map((code) => ({
      code,
      name: names?.of(code) ?? code,
      callingCode: getCountryCallingCode(code),
      flag: flagFor(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

const BY_CODE = new Map(PHONE_COUNTRIES.map((country) => [country.code, country]));

export const findCountry = (code: string | null | undefined): PhoneCountry | null => {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase() as CountryCode) ?? null;
};

/** Used when geo detection returns nothing and the visitor has not chosen. */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry =
  findCountry("US") ?? (PHONE_COUNTRIES[0] as PhoneCountry);

/**
 * Filters on country name, ISO code and dial code, so "91", "+91", "IN" and
 * "ind" all find India.
 */
export const searchCountries = (query: string): readonly PhoneCountry[] => {
  const trimmed = query.trim().toLowerCase().replace(/^\+/, "");
  if (trimmed.length === 0) return PHONE_COUNTRIES;
  return PHONE_COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(trimmed) ||
      country.code.toLowerCase().startsWith(trimmed) ||
      country.callingCode.startsWith(trimmed),
  );
};
