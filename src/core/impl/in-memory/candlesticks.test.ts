import { describe, test, expect } from "vitest";
import { FixedBlockSizeCacheStore } from "@/core/impl/in-memory/candlesticks";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";
import type { Candlestick } from "@/core/base/candlesticks";

describe("FixedBlockSizeCacheStore", async () => {
  const interval: Interval = { amount: 1, unit: "days" };
  const d = (day: number): Date => {
    return intervalLib.addToEpoch(interval, day - 1);
  };
  const t = (day: number): number => {
    return d(day).getTime();
  };
  const c = (day: number): Candlestick => {
    return {
      timestamp: d(day).getTime(),
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
    };
  };
  const dumpCandlestick = (candlestick: Candlestick): string => {
    return new Date(candlestick.timestamp).toISOString();
  };
  test("some", async () => {
    const store = new FixedBlockSizeCacheStore(interval, 3);
    const candlesticks = await store.load(t(3), t(5));
    expect(candlesticks.map((v) => v.map(dumpCandlestick))).toEqual([]);
  });
  test("save two full blocks, load two full blocks", async () => {
    const store = new FixedBlockSizeCacheStore(interval, 3);
    await store.save([1, 2, 3, 4, 5, 6].map(c));
    const candlesticks = await store.load(t(1), t(6));
    expect(candlesticks.map((v) => v.map(dumpCandlestick))).toEqual([
      [
        "1970-01-01T00:00:00.000Z",
        "1970-01-02T00:00:00.000Z",
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
      ],
    ]);
  });
  test("save three full blocks, load from the middle of the first and third", async () => {
    const store = new FixedBlockSizeCacheStore(interval, 3);
    await store.save([1, 2, 3, 4, 5, 6, 7, 8, 9].map(c));
    const candlesticks = await store.load(t(2), t(8) + 1);
    expect(candlesticks.map((v) => v.map(dumpCandlestick))).toEqual([
      [
        "1970-01-02T00:00:00.000Z",
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
        "1970-01-08T00:00:00.000Z",
      ],
    ]);
  });
  test("save first and third full blocks, load from the middle of the first and third", async () => {
    const store = new FixedBlockSizeCacheStore(interval, 3);
    await store.save([1, 2, 3, 7, 8, 9].map(c));
    const candlesticks = await store.load(t(2), t(8) + 1);
    expect(candlesticks.map((v) => v.map(dumpCandlestick))).toEqual([
      ["1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"],
      ["1970-01-07T00:00:00.000Z", "1970-01-08T00:00:00.000Z"],
    ]);
  });
});
