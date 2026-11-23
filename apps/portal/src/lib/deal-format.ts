const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** "IN" becomes "India"; a value Intl does not know is shown as stored. */
export const countryName = (value: string | null): string | null => {
  if (!value) return null;
  try {
    return regionNames.of(value.toUpperCase()) ?? value;
  } catch {
    return value;
  }
};

/** `code` prints "INR 4,200,000": the PDF fonts have no rupee or dirham sign. */
export const formatDealValue = (value: number, currency: string, currencyDisplay: 'symbol' | 'code' = 'symbol'): string => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
};
