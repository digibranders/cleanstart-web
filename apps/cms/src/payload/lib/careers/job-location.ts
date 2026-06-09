export type FormatJobLocationInput = {
  remote: boolean | null | undefined;
  locationNames: readonly string[];
};

/**
 * Builds a human-readable location string for a job from its `remote` flag and
 * its resolved `jobLocations` names. Returns undefined when the job has neither
 * (so callers can omit the line entirely). Examples:
 *   { remote: true,  names: ['San Jose'] } → 'Remote · San Jose'
 *   { remote: true,  names: [] }           → 'Remote'
 *   { remote: false, names: ['Austin','Berlin'] } → 'Austin, Berlin'
 *   { remote: false, names: [] }           → undefined
 */
export const formatJobLocation = (input: FormatJobLocationInput): string | undefined => {
  const names = input.locationNames.map((n) => n.trim()).filter((n) => n.length > 0);
  const joined = names.join(', ');
  if (input.remote) {
    return joined.length > 0 ? `Remote · ${joined}` : 'Remote';
  }
  return joined.length > 0 ? joined : undefined;
};
