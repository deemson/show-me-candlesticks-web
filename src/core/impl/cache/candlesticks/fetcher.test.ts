import { describe, test, expect, vi, beforeEach, type Mock } from "vitest";
import type { Interval } from "@/core/base/interval";
import { addToEpochDate } from "@/core/base/interval";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { UTCDate } from "@date-fns/utc";
import type { Store } from "@/core/impl/cache/candlesticks/fetcher";
import { Fetcher } from "@/core/impl/cache/candlesticks/fetcher";

describe("Fetcher", async () => {
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
  const load: Mock<Store["load"]> = vi.fn(() => {
    throw new Error("store.load unexpected call");
  });
  const save: Mock<Store["save"]> = vi.fn(() => {
    throw new Error("store.save unexpected call");
  });
  const store = {
    load,
    save,
  };
  const interval: Interval = { amount: 1, unit: "days" };
  const d = (day: number): UTCDate => {
    return addToEpochDate(interval, day - 1);
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
  const fetcher = new Fetcher(interval, 5, store, dataFetcher);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchAround", async () => {
    test("no data in cache", async () => {
      store.load.mockResolvedValue([]);
      dataFetcher.fetchAround.mockResolvedValue([2, 3, 4, 5, 6, 7, 8].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchAround(t(5));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(5));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([2, 3, 4, 5, 6, 7, 8].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
    test("missing range", async () => {
      store.load.mockResolvedValue([[c(3)], [c(7)]]);
      dataFetcher.fetchAround.mockResolvedValue([2, 3, 4, 5, 6, 7, 8].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchAround(t(5));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(5));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([2, 3, 4, 5, 6, 7, 8].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
  });

  describe("fetchForward", async () => {
    test("no data in cache", async () => {
      store.load.mockResolvedValue([]);
      dataFetcher.fetchForward.mockResolvedValue([2, 3, 4, 5, 6, 7].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchForward(t(2));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(2), t(6));
      expect(dataFetcher.fetchForward).toHaveBeenCalledExactlyOnceWith(t(2));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([2, 3, 4, 5, 6, 7].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-02T00:00:00.000Z",
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
      ]);
    });
    test("missing range", async () => {
      store.load.mockResolvedValue([[c(2)], [c(6)]]);
      dataFetcher.fetchForward.mockResolvedValue([3, 4, 5, 6, 7].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchForward(t(2));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(2), t(6));
      expect(dataFetcher.fetchForward).toHaveBeenCalledExactlyOnceWith(t(3));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([3, 4, 5, 6, 7].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-02T00:00:00.000Z",
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
      ]);
    });
  });

  describe("fetchBackward", async () => {
    test("no data in cache", async () => {
      store.load.mockResolvedValue([]);
      dataFetcher.fetchBackward.mockResolvedValue([2, 3, 4, 5, 6, 7].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchBackward(t(7));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchBackward).toHaveBeenCalledExactlyOnceWith(t(7));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([2, 3, 4, 5, 6, 7].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
    test("missing range", async () => {
      store.load.mockResolvedValue([[c(3)], [c(7)]]);
      dataFetcher.fetchBackward.mockResolvedValue([2, 3, 4, 5, 6].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchBackward(t(7));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchBackward).toHaveBeenCalledExactlyOnceWith(t(6));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([2, 3, 4, 5, 6].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
  });

  describe("common", async () => {
    test("data fully in cache", async () => {
      store.load.mockResolvedValue([[3, 4, 5, 6, 7].map(c)]);
      const candlesticks = await fetcher.fetchAround(t(5));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
    test("missing head", async () => {
      store.load.mockResolvedValue([[4, 5, 6, 7].map(c)]);
      dataFetcher.fetchBackward.mockResolvedValue([1, 2, 3].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchAround(t(5));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchBackward).toHaveBeenCalledExactlyOnceWith(t(3));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([1, 2, 3].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
    test("missing tail", async () => {
      store.load.mockResolvedValue([[3, 4, 5, 6].map(c)]);
      dataFetcher.fetchForward.mockResolvedValue([7, 8, 9].map(c));
      store.save.mockResolvedValue();
      const candlesticks = await fetcher.fetchAround(t(5));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(3), t(7));
      expect(dataFetcher.fetchForward).toHaveBeenCalledExactlyOnceWith(t(7));
      expect(store.save).toHaveBeenCalledExactlyOnceWith([7, 8, 9].map(c));
      expect(candlesticks.map(dumpCandlestick)).toEqual([
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
        "1970-01-06T00:00:00.000Z",
        "1970-01-07T00:00:00.000Z",
      ]);
    });
  });

  describe("errors", async () => {
    test("empty cache & empty data fetch", async () => {
      store.load.mockResolvedValue([]);
      dataFetcher.fetchAround.mockResolvedValue([]);
      await expect(async () => {
        await fetcher.fetchAround(t(7));
      }).rejects.toThrow("empty data range");
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
      expect(dataFetcher.fetchAround).toHaveBeenCalledExactlyOnceWith(t(7));
    });
    const makeMessage = (p: { n: number; isNoHead: boolean; isNoTail: boolean }): string => {
      const pref = "more than 1 gap in cache results";
      const info = [`N=${p.n}`, `isMissingHead=${p.isNoHead}`, `isMissingTail=${p.isNoTail}`].join(" ");
      return `${pref} (${info})`;
    };
    test("cached block that's missing both head & tail", async () => {
      store.load.mockResolvedValue([[c(6)]]);
      await expect(async () => {
        await fetcher.fetchAround(t(7));
      }).rejects.toThrow(makeMessage({ n: 1, isNoHead: true, isNoTail: true }));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    });
    test("2 cached blocks missing head", async () => {
      store.load.mockResolvedValue([[c(6)], [c(9)]]);
      await expect(async () => {
        await fetcher.fetchAround(t(7));
      }).rejects.toThrow(makeMessage({ n: 2, isNoHead: true, isNoTail: false }));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    });
    test("2 cached blocks missing tail", async () => {
      store.load.mockResolvedValue([[c(5)], [c(8)]]);
      await expect(async () => {
        await fetcher.fetchAround(t(7));
      }).rejects.toThrow(makeMessage({ n: 2, isNoHead: false, isNoTail: true }));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    });
    test("more than 2 cached blocks", async () => {
      store.load.mockResolvedValue([[c(5)], [c(7)], [c(9)]]);
      await expect(async () => {
        await fetcher.fetchAround(t(7));
      }).rejects.toThrow(makeMessage({ n: 3, isNoHead: false, isNoTail: false }));
      expect(store.load).toHaveBeenCalledExactlyOnceWith(t(5), t(9));
    });
  });
});
