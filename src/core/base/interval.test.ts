import { describe, test, expect } from "vitest";
import { differenceInMonths, addHours, addMonths, addDays } from "date-fns";
import { addToEpoch, numberSinceEpoch } from "@/core/base/interval";
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
    expect(date.toISOString()).toEqual("2025-03-29T00:00:00.000Z")
    expect(addDays(date, 2).toISOString()).toEqual("2025-03-30T23:00:00.000Z")
    const utcDate = new UTCDate(2025, 2, 29);
    expect(utcDate.toISOString()).toEqual("2025-03-29T00:00:00.000Z")
    expect(addDays(utcDate, 2).toISOString()).toEqual("2025-03-31T00:00:00.000Z")
  });
});

describe("interval", () => {
  test("addToEpoch", () => {
    expect(addToEpoch({ amount: 3, unit: "minutes" }, 3).toISOString()).toEqual("1970-01-01T00:09:00.000Z");
  });
  test("numberSinceEpoch", () => {
    expect(numberSinceEpoch({ amount: 1, unit: "days" }, new UTCDate(1970, 0))).toEqual(0);
    expect(numberSinceEpoch({ amount: 1, unit: "minutes" }, new UTCDate(1970, 0, 1, 0, 7))).toEqual(7);
    expect(numberSinceEpoch({ amount: 5, unit: "minutes" }, new UTCDate(1970, 0, 1, 0, 12))).toEqual(2);
  });
});
