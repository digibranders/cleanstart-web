// src/lib/clock.ts
export interface Clock {
  now(): Date;
  /** The UTC calendar date, YYYY-MM-DD. */
  today(): string;
}

export const systemClock: Clock = {
  now: () => new Date(),
  today: () => new Date().toISOString().slice(0, 10),
};

export const fixedClock = (iso: string): Clock => {
  const at = new Date(iso);
  return { now: () => new Date(at.getTime()), today: () => at.toISOString().slice(0, 10) };
};
