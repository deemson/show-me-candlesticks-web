export const values = ["1m", "1h", "1d"] as const;

export type Interval = (typeof values)[number];

export const minuteMap: Record<Interval, number> = {
  "1m": 1,
  "1h": 60,
  "1d": 24 * 60,
};
