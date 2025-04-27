import {
  differenceInMinutes as dateFnsDifferenceInMinutes,
  differenceInHours as dateFnsDifferenceInHours,
  differenceInWeeks as dateFnsDifferenceInWeeks,
  differenceInMonths as dateFnsDifferenceInMonths,
} from "date-fns";

export const allIntervals = ["1m", "5m", "15m", "30m", "1h", "1w", "1M"] as const;
export type Interval = (typeof allIntervals)[number];

type DifferenceFunc = (earlierDate: Date, laterDate: Date) => number;

interface Functions {
  difference: DifferenceFunc;
}

const differenceInMinutes = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInMinutes(laterDate, earlierDate);
};

const makeDifferenceInNumberOfMinutes = (num: number): DifferenceFunc => {
  return (earlierDate: Date, laterDate: Date): number => {
    return Math.floor(differenceInMinutes(earlierDate, laterDate) / num);
  };
};

const differenceInHours = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInHours(laterDate, earlierDate);
};

const differenceInWeeks = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInWeeks(laterDate, earlierDate);
};

const differenceInMonths = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInMonths(laterDate, earlierDate);
};

const functionsMap: Record<Interval, Functions> = {
  "1m": {
    difference: differenceInMinutes,
  },
  "5m": {
    difference: makeDifferenceInNumberOfMinutes(5),
  },
  "15m": {
    difference: makeDifferenceInNumberOfMinutes(15),
  },
  "30m": {
    difference: makeDifferenceInNumberOfMinutes(30),
  },
  "1h": {
    difference: differenceInHours,
  },
  "1w": {
    difference: differenceInWeeks,
  },
  "1M": {
    difference: differenceInMonths,
  },
};

const epochDate = new Date(Date.UTC(1970, 0));

export const difference = (interval: Interval, earlierDate: Date, laterDate: Date): number => {
  return functionsMap[interval].difference(earlierDate, laterDate);
};

export const numberSinceEpoch = (interval: Interval, date: Date): number => {
  return difference(interval, epochDate, date);
};
