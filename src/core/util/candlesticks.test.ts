import { describe, test, expect, vi, beforeEach, type Mock } from "vitest";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";
import { CachingFetcher } from "@/core/util/candlesticks";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { CacheStore } from "@/core/util/candlesticks";

describe("CachingFetcher", async () => {
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
  const fetchAround: Mock<IFetcher["fetchAround"]> = vi.fn(() => {
    throw new Error("dataFetcher.fetchAround unexpected call");
  });
  const fetchBackward: Mock<IFetcher["fetchBackward"]> = vi.fn(() => {
    throw new Error("dataFetcher.fetchBackward unexpected call");
  });
  const fetchForward: Mock<IFetcher["fetchForward"]> = vi.fn(() => {
    throw new Error("dataFetcher.fetchForward unexpected call");
  });
  const dataFetcher = {
    fetchAround,
    fetchBackward,
    fetchForward,
  };
  const load: Mock<CacheStore["load"]> = vi.fn(() => {
    throw new Error("cacheStore.load unexpected call");
  });
  const save: Mock<CacheStore["save"]> = vi.fn(() => {
    throw new Error("cacheStore.save unexpected call");
  });
  const cacheStore = {
    load,
    save,
  };
  const fetcher = new CachingFetcher(interval, 5, cacheStore, dataFetcher);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // simplistic tests to hit the coverage for fetchForward & fetchBackward
  // everything else is going to be tested with fetchAround and it's ok
  // as all these three methods are calling fetchDataRange anyway so the difference
  // is only minor in how this range is calculated within those three
  test("fetchForward", async () => {
    cacheStore.load.mockResolvedValue([]);
    dataFetcher.fetchAround.mockResolvedValue([5, 6, 7, 8, 9].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchForward(t(5));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([5, 6, 7, 8, 9].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("fetchBackward", async () => {
    cacheStore.load.mockResolvedValue([]);
    dataFetcher.fetchAround.mockResolvedValue([5, 6, 7, 8, 9].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchBackward(t(9));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([5, 6, 7, 8, 9].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  // ok, with that out of the way the let's get into the real stuff
  test("no data in cache -> data fetch missing range", async () => {
    cacheStore.load.mockResolvedValue([]);
    dataFetcher.fetchAround.mockResolvedValue([5, 6, 7, 8, 9].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchAround(t(7));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([5, 6, 7, 8, 9].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("cache contains the entire block", async () => {
    cacheStore.load.mockResolvedValue([[5, 6, 7, 8, 9].map(c)]);
    const candlesticks = await fetcher.fetchAround(t(7));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("data in cache contains head -> data fetch missing tail", async () => {
    cacheStore.load.mockResolvedValue([[c(5)]]);
    dataFetcher.fetchForward.mockResolvedValue([6, 7, 8, 9].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchAround(t(7));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchForward).toHaveBeenCalledExactlyOnceWith(t(6));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([6, 7, 8, 9].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("data in cache contains tail -> data fetch missing head", async () => {
    cacheStore.load.mockResolvedValue([[c(9)]]);
    dataFetcher.fetchBackward.mockResolvedValue([5, 6, 7, 8].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchAround(t(7));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchBackward).toHaveBeenCalledExactlyOnceWith(t(8));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([5, 6, 7, 8].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("data in cache contains head & tail -> data fetch missing range", async () => {
    cacheStore.load.mockResolvedValue([[c(5)], [c(9)]]);
    dataFetcher.fetchAround.mockResolvedValue([6, 7, 8].map(c));
    cacheStore.save.mockResolvedValue();
    const candlesticks = await fetcher.fetchAround(t(7));
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
    expect(cacheStore.save).toHaveBeenCalledExactlyOnceWith([6, 7, 8].map(c));
    expect(candlesticks.map(dumpCandlestick)).toEqual([
      "1970-01-05T00:00:00.000Z",
      "1970-01-06T00:00:00.000Z",
      "1970-01-07T00:00:00.000Z",
      "1970-01-08T00:00:00.000Z",
      "1970-01-09T00:00:00.000Z",
    ]);
  });
  test("empty cache -> empty data fetch -> error", async () => {
    cacheStore.load.mockResolvedValue([]);
    dataFetcher.fetchAround.mockResolvedValue([]);
    await expect(async () => {
      await fetcher.fetchAround(t(7));
    }).rejects.toThrow("empty data range");
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
  });
  test("cached block that's missing both head & tail -> error", async () => {
    cacheStore.load.mockResolvedValue([[c(6)]]);
    await expect(async () => {
      await fetcher.fetchAround(t(7));
    }).rejects.toThrow("candlestick block missing both head & tail");
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
  });
  test("2 cached blocks missing head -> error", async () => {
    cacheStore.load.mockResolvedValue([[c(6)], [c(9)]]);
    await expect(async () => {
      await fetcher.fetchAround(t(7));
    }).rejects.toThrow("2 candlestick blocks missing head");
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
  });
  test("2 cached blocks missing tail -> error", async () => {
    cacheStore.load.mockResolvedValue([[c(5)], [c(8)]]);
    await expect(async () => {
      await fetcher.fetchAround(t(7));
    }).rejects.toThrow("2 candlestick blocks missing tail");
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
  });
  test("more than 2 cached blocks -> error", async () => {
    cacheStore.load.mockResolvedValue([[c(5)], [c(7)], [c(9)]]);
    await expect(async () => {
      await fetcher.fetchAround(t(7));
    }).rejects.toThrow("more than 2 candlestick blocks");
    expect(cacheStore.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
  });
});
