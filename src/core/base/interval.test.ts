import { describe, test, expect } from "vitest";
import { differenceInMonths, addHours, addMonths, addDays } from "date-fns";
import type { Interval } from "@/core/base/interval";
import {
  toShortString,
  fromShortString,
  addToTimestamp,
  subtractFromTimestamp,
  differenceBetweenTimestamps,
  addToEpochTimestamp,
  numberSinceEpochTimestamp,
} from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

describe("date demonstrative tests", () => {
  test("start of the epoch and a slight shift", () => {
    expect(Date.UTC(1970, 0)).toEqual(0);
    expect(Date.UTC(1970, 0, 1, 0, 3, 0, 3)).toEqual(60 * 3 * 1000 + 3);
  });
  test("month since epoch calculation", () => {
    const date = new Date(Date.UTC(1972, 3));
    expect(date.toISOString()).toEqual("1972-04-01T00:00:00.000Z");
    expect((date.getUTCFullYear() - 1970) * 12 + date.getUTCMonth()).toEqual(27);
    const epochDate = new Date(Date.UTC(1970, 0));
    expect(differenceInMonths(date, epochDate)).toEqual(27);
    expect(differenceInMonths(addHours(date, 3), epochDate)).toEqual(27);
    expect(addMonths(epochDate, 28).toISOString()).toEqual("1972-05-01T00:00:00.000Z");
  });
  test("float number date calculation", () => {
    const date = new Date(Date.UTC(1970, 0));
    expect(addHours(date, 1.5).toISOString()).toEqual("1970-01-01T01:30:00.000Z");
    expect(addMonths(date, 0.5).toISOString()).toEqual("1970-01-01T00:00:00.000Z");
    expect(addMonths(date, 2.5).toISOString()).toEqual("1970-03-01T00:00:00.000Z");
  });
  test("day saving", () => {
    const date = new Date(Date.UTC(2025, 2, 29));
    expect(date.toISOString()).toEqual("2025-03-29T00:00:00.000Z");
    expect(addDays(date, 2).toISOString()).toEqual("2025-03-30T23:00:00.000Z");
    const utcDate = new UTCDate(2025, 2, 29);
    expect(utcDate.toISOString()).toEqual("2025-03-29T00:00:00.000Z");
    expect(addDays(utcDate, 2).toISOString()).toEqual("2025-03-31T00:00:00.000Z");
  });
});

test("toShortString", () => {
  expect(toShortString({ amount: 3, unit: "minutes" })).toEqual("3m");
  expect(toShortString({ amount: 5, unit: "hours" })).toEqual("5h");
  expect(toShortString({ amount: 3, unit: "months" })).toEqual("3M");
});

test("fromShortString", () => {
  expect(fromShortString("15m")).toEqual({ unit: "minutes", amount: 15 });
  expect(() => {
    fromShortString("");
  }).toThrow("empty string");
  expect(() => {
    fromShortString("!");
  }).toThrow("'!' is an incorrect unit");
  expect(() => {
    fromShortString("!!m");
  }).toThrow("'!!' is an incorrect amount");
  expect(fromShortString("2.8m")).toEqual({ unit: "minutes", amount: 2 });
  expect(() => {
    fromShortString("-5m");
  }).toThrow("expected amount to be a positive integer, got -5 instead");
});

test("addToTimestamp", () => {
  const f = (interval: Interval): string => {
    const date = new UTCDate(2000, 1, 3, 4, 5, 6);
    return new UTCDate(addToTimestamp(interval, date.getTime(), 1)).toISOString();
  };
  expect(f({ amount: 3, unit: "seconds" })).toEqual("2000-02-03T04:05:09.000Z");
  expect(f({ amount: 3, unit: "minutes" })).toEqual("2000-02-03T04:08:06.000Z");
  expect(f({ amount: 3, unit: "hours" })).toEqual("2000-02-03T07:05:06.000Z");
  expect(f({ amount: 3, unit: "days" })).toEqual("2000-02-06T04:05:06.000Z");
  expect(f({ amount: 3, unit: "weeks" })).toEqual("2000-02-24T04:05:06.000Z");
  expect(f({ amount: 3, unit: "months" })).toEqual("2000-05-03T04:05:06.000Z");
});

test("subtractFromTimestamp", () => {
  const f = (interval: Interval): string => {
    const date = new UTCDate(2000, 6, 7, 8, 9, 10);
    return new UTCDate(subtractFromTimestamp(interval, date.getTime(), 1)).toISOString();
  };
  expect(f({ amount: 3, unit: "seconds" })).toEqual("2000-07-07T08:09:07.000Z");
  expect(f({ amount: 3, unit: "minutes" })).toEqual("2000-07-07T08:06:10.000Z");
  expect(f({ amount: 3, unit: "hours" })).toEqual("2000-07-07T05:09:10.000Z");
  expect(f({ amount: 3, unit: "days" })).toEqual("2000-07-04T08:09:10.000Z");
  expect(f({ amount: 3, unit: "weeks" })).toEqual("2000-06-16T08:09:10.000Z");
  expect(f({ amount: 3, unit: "months" })).toEqual("2000-04-07T08:09:10.000Z");
});

test("differenceBetweenTimestamps", () => {
  const f = (interval: Interval, date: UTCDate): number => {
    const earlierTimestamp = new UTCDate(0).getTime();
    const laterTimestamp = date.getTime();
    return differenceBetweenTimestamps(interval, earlierTimestamp, laterTimestamp);
  };
  expect(f({ amount: 3, unit: "seconds" }, new UTCDate(1970, 0, 1, 0, 0, 7))).toEqual(2);
  expect(f({ amount: 2, unit: "minutes" }, new UTCDate(1970, 0, 1, 0, 5))).toEqual(2);
  expect(f({ amount: 3, unit: "hours" }, new UTCDate(1970, 0, 1, 10))).toEqual(3);
  expect(f({ amount: 4, unit: "days" }, new UTCDate(1970, 0, 9))).toEqual(2);
  expect(f({ amount: 1, unit: "weeks" }, new UTCDate(1970, 0, 20))).toEqual(2);
  expect(f({ amount: 2, unit: "months" }, new UTCDate(1970, 5))).toEqual(2);
});

test("addToEpochTimestamp", () => {
  const f = (interval: Interval, amount: number): string => {
    return new UTCDate(addToEpochTimestamp(interval, amount)).toISOString();
  };
  expect(f({ amount: 3, unit: "minutes" }, 3)).toEqual("1970-01-01T00:09:00.000Z");
});

test("numberSinceEpochTimestamp", () => {
  const f = (interval: Interval, date: UTCDate): number => {
    return numberSinceEpochTimestamp(interval, date.getTime());
  };
  expect(f({ amount: 1, unit: "days" }, new UTCDate(1970, 0))).toEqual(0);
  expect(f({ amount: 1, unit: "minutes" }, new UTCDate(1970, 0, 1, 0, 7))).toEqual(7);
  expect(f({ amount: 5, unit: "minutes" }, new UTCDate(1970, 0, 1, 0, 12))).toEqual(2);
});
