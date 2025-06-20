import "fake-indexeddb/auto";
import type { Candlestick } from "@/core/base/candlesticks";
import { addToEpochDate, type Interval } from "@/core/base/interval";
import type { UTCDate } from "@date-fns/utc";
import { BlockCacheStoreProvider } from "@/core/impl/idb/candlesticks";
import { describe, test, expect } from "vitest";

describe("BlockCacheStoreProvider", async () => {
  const exchange = "exchange";
  const symbol = "symbol";
  const interval: Interval = { amount: 1, unit: "days" };
  const d = (day: number): UTCDate => {
    return addToEpochDate(interval, day - 1);
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

  const provider = await BlockCacheStoreProvider.initialize("test-db");

  test("save/load", async () => {
    const store = provider.get(exchange);
    await store.save(
      symbol,
      interval,
      new Map([
        [1, [1, 2, 3].map(c)],
        [3, [7, 8, 9].map(c)],
        [5, [13, 14, 15].map(c)],
      ]),
    );
    const blockMap = await store.load(symbol, interval, 1, 5);
    expect(
      blockMap
        .entries()
        .toArray()
        .map(([number, candlesticks]) => {
          return [number, candlesticks.map(dumpCandlestick)];
        }),
    ).toEqual([
      [1, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
      [3, ["1970-01-07T00:00:00.000Z", "1970-01-08T00:00:00.000Z", "1970-01-09T00:00:00.000Z"]],
      [5, ["1970-01-13T00:00:00.000Z", "1970-01-14T00:00:00.000Z", "1970-01-15T00:00:00.000Z"]],
    ]);
  });
});
