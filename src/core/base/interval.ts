import * as dateFns from "date-fns";

export const allUnits = ["seconds", "minutes", "hours", "days", "weeks", "months"] as const;
export type Unit = (typeof allUnits)[number];

export interface Interval {
  unit: Unit;
  amount: number;
}

interface UnitOperations {
  add: (date: Date, amount: number) => Date;
  subtract: (date: Date, amount: number) => Date;
  difference: (earlierDate: Date, laterDate: Date) => number;
}

const unitOperationsMap: Record<Unit, UnitOperations> = {
  seconds: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addSeconds(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subSeconds(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInSeconds(laterDate, earlierDate);
    },
  },
  minutes: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addMinutes(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subMinutes(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInMinutes(laterDate, earlierDate);
    },
  },
  hours: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addHours(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subHours(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInHours(laterDate, earlierDate);
    },
  },
  days: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addDays(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subDays(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInDays(laterDate, earlierDate);
    },
  },
  weeks: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addWeeks(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subWeeks(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInWeeks(laterDate, earlierDate);
    },
  },
  months: {
    add: (date: Date, amount: number): Date => {
      return dateFns.addMonths(date, amount);
    },
    subtract: (date: Date, amount: number): Date => {
      return dateFns.subMonths(date, amount);
    },
    difference: (earlierDate: Date, laterDate: Date): number => {
      return dateFns.differenceInMonths(laterDate, earlierDate);
    },
  },
};

export const difference = (interval: Interval, earlierDate: Date, laterDate: Date): number => {
  return Math.floor(unitOperationsMap[interval.unit].difference(earlierDate, laterDate) / interval.amount);
};

const epochDate = new Date(Date.UTC(1970, 0));

export const numberSinceEpoch = (interval: Interval, date: Date): number => {
  return difference(interval, epochDate, date);
};
