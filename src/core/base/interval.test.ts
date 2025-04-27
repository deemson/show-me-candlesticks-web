import { describe, test, expect } from "vitest";
import { differenceInMonths, addHours, addMonths } from "date-fns";
import { numberSinceEpoch } from "@/core/base/interval";

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
});

describe("interval", () => {
  test("numberSinceEpoch", () => {
    expect(numberSinceEpoch("1m", new Date(Date.UTC(1970, 0, 1, 0, 7)))).toEqual(7);
    expect(numberSinceEpoch("5m", new Date(Date.UTC(1970, 0, 1, 0, 12)))).toEqual(2);
  });
});
