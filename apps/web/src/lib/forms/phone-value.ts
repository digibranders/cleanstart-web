import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";

import { DEFAULT_PHONE_COUNTRY, findCountry, type PhoneCountry } from "./countries";

/**
 * What a phone field holds: the chosen country plus the digits the visitor
 * typed, with no dial code and no punctuation. Keeping the two apart is what
 * lets the country dropdown re-format an already-typed number, and what lets
 * the lead record store the country without a second question on the form.
 */
export interface PhoneValue {
  country: PhoneCountry;
  /** National significant number, digits only. */
  national: string;
}

export const emptyPhoneValue = (country: PhoneCountry = DEFAULT_PHONE_COUNTRY): PhoneValue => ({
  country,
  national: "",
});

/** The field accepts digits and nothing else, so strip everything else on input. */
export const digitsOnly = (raw: string): string => raw.replace(/\D/gu, "");

/**
 * Groups the digits the way the selected country writes them, e.g. "4155552671"
 * renders as "415 555 2671" and "2071838750" as "20 7183 8750". Display only.
 *
 * Grouping goes through the international form with the dial code stripped
 * back off, rather than through national formatting. libphonenumber only
 * groups a national number when its trunk prefix is present, so GB, DE, FR, AU
 * and JP come back as one unbroken run of digits otherwise; and prefixing the
 * trunk digit to get grouping leaves a leading "0" the visitor never typed and
 * cannot delete. The dial code is a known exact string, so removing it is
 * deterministic in a way that stripping a trunk prefix is not.
 *
 * The guard keeps formatting cosmetic: if the formatter ever returns a
 * different set of digits than it was given, the raw digits are shown instead.
 * Losing the grouping is a far smaller failure than displaying a different
 * number.
 */
export const formatNational = (value: PhoneValue): string => {
  if (value.national.length === 0) return "";
  const prefix = `+${value.country.callingCode}`;
  const international = new AsYouType().input(`${prefix}${value.national}`);
  const grouped = international.startsWith(prefix)
    ? international.slice(prefix.length).trimStart()
    : international;
  return grouped.replace(/\D/gu, "") === value.national ? grouped : value.national;
};

/**
 * Reads a full international number, so pasting "+44 20 7183 8750" or
 * "0044 20 7183 8750" switches the country to the UK and fills in 2071838750
 * rather than treating the 44 as part of the local number.
 *
 * @returns null when the text is not an international number, which leaves the
 *          caller to treat it as national digits for the current country.
 */
export const parseInternational = (raw: string): PhoneValue | null => {
  const trimmed = raw.trim();
  const international = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
  if (!international.startsWith("+")) return null;
  const parsed = parsePhoneNumberFromString(international);
  if (!parsed?.country) return null;
  const country = findCountry(parsed.country);
  if (!country) return null;
  return { country, national: parsed.nationalNumber };
};

/** The wire format. Null when the digits cannot make a real number. */
export const toE164 = (value: PhoneValue): string | null => {
  if (value.national.length === 0) return null;
  const parsed = parsePhoneNumberFromString(
    `+${value.country.callingCode}${value.national}`,
  );
  return parsed?.isValid() ? parsed.number : null;
};

export type PhoneFailure = "required" | "invalid";

export const PHONE_MESSAGES: Readonly<Record<PhoneFailure, string>> = {
  required: "Phone number is required.",
  invalid: "Enter a valid phone number for the country you selected.",
};

/**
 * @returns null when the value is acceptable, otherwise the message to show
 *          under the field.
 */
export const validatePhone = (
  value: PhoneValue,
  options: { required: boolean },
): string | null => {
  if (value.national.length === 0) {
    return options.required ? PHONE_MESSAGES.required : null;
  }
  return toE164(value) === null ? PHONE_MESSAGES.invalid : null;
};

/** Longest national number in the E.164 plan is 15 digits minus the dial code. */
export const maxNationalDigits = (country: PhoneCountry): number =>
  15 - country.callingCode.length;
