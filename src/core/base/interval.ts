import { UTCDate } from "@date-fns/utc";
import * as dateFns from "date-fns";

export const allUnits = ["seconds", "minutes", "hours", "days", "weeks", "months"] as const;
export type Unit = (typeof allUnits)[number];

const unitShortStringMap: Map<Unit, string> = new Map([
  ["seconds", "s"],
  ["minutes", "m"],
  ["hours", "h"],
  ["days", "d"],
  ["weeks", "w"],
  ["months", "M"],
]);
const unitShortStringReversedMap: Map<string, Unit> = new Map(
  unitShortStringMap.entries().map(([unit, str]) => {
    return [str, unit];
  }),
);

const unitToShortString = (unit: Unit): string => {
  return unitShortStringMap.get(unit) as string;
};

const unitFromShortString = (str: string): Unit => {
  const unit = unitShortStringReversedMap.get(str);
  if (unit === undefined) {
    throw new Error(`'${str}' is an incorrect unit`);
  }
  return unit;
};

interface UnitOperations {
  add: (date: UTCDate, amount: number) => UTCDate;
  subtract: (date: UTCDate, amount: number) => UTCDate;
  difference: (earlierDate: UTCDate, laterDate: UTCDate) => number;
}

const unitOperationsMap: Record<Unit, UnitOperations> = {
  seconds: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addSeconds(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subSeconds(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInSeconds(laterDate, earlierDate);
    },
  },
  minutes: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addMinutes(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subMinutes(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInMinutes(laterDate, earlierDate);
    },
  },
  hours: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addHours(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subHours(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInHours(laterDate, earlierDate);
    },
  },
  days: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addDays(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subDays(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInDays(laterDate, earlierDate);
    },
  },
  weeks: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addWeeks(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subWeeks(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInWeeks(laterDate, earlierDate);
    },
  },
  months: {
    add: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.addMonths(date, amount);
    },
    subtract: (date: UTCDate, amount: number): UTCDate => {
      return dateFns.subMonths(date, amount);
    },
    difference: (earlierDate: UTCDate, laterDate: UTCDate): number => {
      return dateFns.differenceInMonths(laterDate, earlierDate);
    },
  },
};

export interface Interval {
  unit: Unit;
  amount: number;
}

export const toShortString = (interval: Interval): string => {
  const amount = interval.amount.toString();
  const unit = unitToShortString(interval.unit);
  return `${amount}${unit}`;
};

export const fromShortString = (str: string): Interval => {
  if (str.length === 0) {
    throw new Error("empty string");
  }
  const unit = unitFromShortString(str[str.length - 1]);
  const amountStr = str.slice(0, -1);
  const amount = Number.parseInt(amountStr, 10);
  if (Number.isNaN(amount)) {
    throw new Error(`'${amountStr}' is an incorrect amount`)
  }
  if (amount <= 0) {
    throw new Error(`expected amount to be a positive integer, got ${amountStr} instead`)
  }
  return { unit, amount };
};

export const addToDate = (interval: Interval, date: UTCDate, amount: number): UTCDate => {
  return unitOperationsMap[interval.unit].add(date, interval.amount * amount);
};

export const addToTimestampToDate = (interval: Interval, timestamp: number, amount: number): UTCDate => {
  const date = new UTCDate(timestamp);
  return addToDate(interval, date, amount);
};

export const addToTimestamp = (interval: Interval, timestamp: number, amount: number): number => {
  return addToTimestampToDate(interval, timestamp, amount).getTime();
};

export const subtractFromDate = (interval: Interval, date: UTCDate, amount: number): UTCDate => {
  return unitOperationsMap[interval.unit].subtract(date, interval.amount * amount);
};

export const subtractFromTimestampToDate = (interval: Interval, timestamp: number, amount: number): UTCDate => {
  const date = new UTCDate(timestamp);
  return subtractFromDate(interval, date, amount);
};

export const subtractFromTimestamp = (interval: Interval, timestamp: number, amount: number): number => {
  return subtractFromTimestampToDate(interval, timestamp, amount).getTime();
};

export const differenceBetweenDates = (interval: Interval, earlierDate: UTCDate, laterDate: UTCDate): number => {
  return Math.floor(unitOperationsMap[interval.unit].difference(earlierDate, laterDate) / interval.amount);
};

export const differenceBetweenTimestamps = (
  interval: Interval,
  earlierTimestamp: number,
  laterTimestamp: number,
): number => {
  const earlierDate = new UTCDate(earlierTimestamp);
  const laterDate = new UTCDate(laterTimestamp);
  return differenceBetweenDates(interval, earlierDate, laterDate);
};

const epochDate = new UTCDate(1970, 0);

export const addToEpochDate = (interval: Interval, amount: number): UTCDate => {
  return addToDate(interval, epochDate, amount);
};

export const addToEpochTimestamp = (interval: Interval, amount: number): number => {
  return addToEpochDate(interval, amount).getTime();
};

export const numberSinceEpochDate = (interval: Interval, date: UTCDate): number => {
  return differenceBetweenDates(interval, epochDate, date);
};

export const numberSinceEpochTimestamp = (interval: Interval, timestamp: number): number => {
  const date = new UTCDate(timestamp);
  return numberSinceEpochDate(interval, date);
};
