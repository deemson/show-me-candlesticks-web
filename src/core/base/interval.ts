import { UTCDate } from "@date-fns/utc";
import * as dateFns from "date-fns";

export const allUnits = ["seconds", "minutes", "hours", "days", "weeks", "months"] as const;
export type Unit = (typeof allUnits)[number];

export interface Interval {
  unit: Unit;
  amount: number;
}

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

export const add = (interval: Interval, date: UTCDate, amount: number): UTCDate => {
  return unitOperationsMap[interval.unit].add(date, interval.amount * amount);
};

export const subtract = (interval: Interval, date: UTCDate, amount: number): UTCDate => {
  return unitOperationsMap[interval.unit].subtract(date, interval.amount * amount);
};

export const difference = (interval: Interval, earlierDate: UTCDate, laterDate: UTCDate): number => {
  return Math.floor(unitOperationsMap[interval.unit].difference(earlierDate, laterDate) / interval.amount);
};

const epochDate = new UTCDate(1970, 0);

export const addToEpoch = (interval: Interval, amount: number): UTCDate => {
  return add(interval, epochDate, amount);
};

export const numberSinceEpoch = (interval: Interval, date: UTCDate): number => {
  return difference(interval, epochDate, date);
};
