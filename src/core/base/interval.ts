import {
  differenceInSeconds as dateFnsDifferenceInSeconds,
  differenceInMinutes as dateFnsDifferenceInMinutes,
  differenceInHours as dateFnsDifferenceInHours,
  differenceInDays as dateFnsDifferenceInDays,
  differenceInWeeks as dateFnsDifferenceInWeeks,
  differenceInMonths as dateFnsDifferenceInMonths,
} from "date-fns";

export const allIntervals = [
  "1s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "15d",
  "1w",
  "1M",
] as const;
export type Interval = (typeof allIntervals)[number];

type DifferenceFunc = (earlierDate: Date, laterDate: Date) => number;

interface Functions {
  difference: DifferenceFunc;
}

const differenceInSeconds = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInSeconds(laterDate, earlierDate);
};

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

const makeDifferenceInNumberOfHours = (num: number): DifferenceFunc => {
  return (earlierDate: Date, laterDate: Date): number => {
    return Math.floor(differenceInHours(earlierDate, laterDate) / num);
  };
};

const differenceInDays = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInDays(laterDate, earlierDate);
};

const makeDifferenceInNumberOfDays = (num: number): DifferenceFunc => {
  return (earlierDate: Date, laterDate: Date): number => {
    return Math.floor(differenceInDays(earlierDate, laterDate) / num);
  };
};

const differenceInWeeks = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInWeeks(laterDate, earlierDate);
};

const differenceInMonths = (earlierDate: Date, laterDate: Date): number => {
  return dateFnsDifferenceInMonths(laterDate, earlierDate);
};

const functionsMap: Record<Interval, Functions> = {
  "1s": {
    difference: differenceInSeconds,
  },
  "1m": {
    difference: differenceInMinutes,
  },
  "3m": {
    difference: makeDifferenceInNumberOfMinutes(3),
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
  "2h": {
    difference: makeDifferenceInNumberOfHours(2),
  },
  "4h": {
    difference: makeDifferenceInNumberOfHours(4),
  },
  "6h": {
    difference: makeDifferenceInNumberOfHours(6),
  },
  "8h": {
    difference: makeDifferenceInNumberOfHours(8),
  },
  "12h": {
    difference: makeDifferenceInNumberOfHours(12),
  },
  "1d": {
    difference: differenceInDays,
  },
  "3d": {
    difference: makeDifferenceInNumberOfDays(3),
  },
  "1w": {
    difference: differenceInWeeks,
  },
  "15d": {
    difference: makeDifferenceInNumberOfDays(15),
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
