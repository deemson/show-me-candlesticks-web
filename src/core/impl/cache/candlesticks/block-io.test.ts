import { describe, test, expect, beforeEach } from "vitest";
import type { Candlestick } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import { addToEpochDate, addToDate } from "@/core/base/interval";
import type { BlockMap, Store } from "@/core/impl/cache/candlesticks/block-io";
import { BlockIO, FixedBlockSizeIndexer } from "@/core/impl/cache/candlesticks/block-io";
import type { Indexer, Index } from "@/core/impl/cache/candlesticks/block-io";
import type { UTCDate } from "@date-fns/utc";

describe("BlockIO", async () => {
  const interval: Interval = { unit: "days", amount: 1 };

  const storeBlockMap: BlockMap = new Map();
  const store: Store = {
    load: async (fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> => {
      const blockMap: BlockMap = new Map();
      for (let i = fromBlockNumber; i <= toBlockNumber; i++) {
        if (storeBlockMap.has(i)) {
          blockMap.set(i, storeBlockMap.get(i) as Candlestick[]);
        }
      }
      return blockMap;
    },
    save: async (blockMap: BlockMap) => {
      for (const [k, v] of blockMap.entries()) {
        storeBlockMap.set(k, v);
      }
    },
  };
  const io = new BlockIO(new FixedBlockSizeIndexer(interval, 3), store);

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
  const dumpBlockMap = (blockMap: BlockMap): [number, string[]][] => {
    const entries = blockMap.entries().toArray();
    entries.sort((a, b) => a[0] - b[0]);
    return entries.map(([num, candlesticks]) => [num, candlesticks.map(dumpCandlestick)]);
  };
  const dumpCandlesticks = (candlesticks: Candlestick[]): string[] => {
    return candlesticks.map(dumpCandlestick);
  };
  const dumpCandlestickBlocks = (candlestickBlocks: Candlestick[][]): string[][] => {
    return candlestickBlocks.map(dumpCandlesticks);
  };

  beforeEach(() => {
    for (const key of storeBlockMap.keys()) {
      storeBlockMap.delete(key);
    }
  });

  test("save 2 contiguous blocks & load them", async () => {
    await io.save([1, 2, 3, 4, 5, 6].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [0, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
      [1, ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(1), t(6));
    expect(dumpCandlestickBlocks(blocks)).toEqual([
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
  test("save 2 contiguous blocks & load from the middle of them", async () => {
    await io.save([1, 2, 3, 4, 5, 6].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [0, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
      [1, ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(2), t(5));
    expect(dumpCandlestickBlocks(blocks)).toEqual([
      ["1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z", "1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z"],
    ]);
  });
  test("save block 1, load from block 0", async () => {
    await io.save([4, 5, 6].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [1, ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(1), t(6));
    expect(dumpCandlestickBlocks(blocks)).toEqual([
      ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"],
    ]);
  });
  test("save blocks 0, 2, 3 & load 0 to 3", async () => {
    await io.save([1, 2, 3, 7, 8, 9, 10, 11, 12].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [0, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
      [2, ["1970-01-07T00:00:00.000Z", "1970-01-08T00:00:00.000Z", "1970-01-09T00:00:00.000Z"]],
      [3, ["1970-01-10T00:00:00.000Z", "1970-01-11T00:00:00.000Z", "1970-01-12T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(1), t(12));
    expect(dumpCandlestickBlocks(blocks)).toEqual([
      ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"],
      [
        "1970-01-07T00:00:00.000Z",
        "1970-01-08T00:00:00.000Z",
        "1970-01-09T00:00:00.000Z",
        "1970-01-10T00:00:00.000Z",
        "1970-01-11T00:00:00.000Z",
        "1970-01-12T00:00:00.000Z",
      ],
    ]);
  });
  test("save 2 contiguous blocks & load from one to weird timestamp somewhere in between", async () => {
    await io.save([1, 2, 3, 4, 5, 6].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [0, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
      [1, ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(1), addToDate({ unit: "hours", amount: 1 }, d(5), 2).getTime());
    expect(dumpCandlestickBlocks(blocks)).toEqual([
      [
        "1970-01-01T00:00:00.000Z",
        "1970-01-02T00:00:00.000Z",
        "1970-01-03T00:00:00.000Z",
        "1970-01-04T00:00:00.000Z",
        "1970-01-05T00:00:00.000Z",
      ],
    ]);
  });
  test("save block 0 & load 0, 1, 2", async () => {
    await io.save([1, 2, 3].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [0, ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"]],
    ]);
    const blocks = await io.load(t(1), t(9));
    expect(dumpCandlestickBlocks(blocks)).toEqual([
      ["1970-01-01T00:00:00.000Z", "1970-01-02T00:00:00.000Z", "1970-01-03T00:00:00.000Z"],
    ]);
  });
  test("save incomplete block 0 and complete 1, 2", async () => {
    await io.save([2, 3, 4, 5, 6, 7, 8, 9].map(c));
    expect(dumpBlockMap(storeBlockMap)).toEqual([
      [1, ["1970-01-04T00:00:00.000Z", "1970-01-05T00:00:00.000Z", "1970-01-06T00:00:00.000Z"]],
      [2, ["1970-01-07T00:00:00.000Z", "1970-01-08T00:00:00.000Z", "1970-01-09T00:00:00.000Z"]],
    ]);
  });
  test("save non-contiguous block 0", async () => {
    await expect(async () => {
      await io.save([1, 3].map(c));
    }).rejects.toThrow(
      [
        "non-contiguous cache for block 0:",
        "received index 2 after index 0",
        "reported at 1970-01-03T00:00:00.000Z",
      ].join(" "),
    );
  });
  test("save indexing issue", async () => {
    let isFirstCall = true;
    const indexer: Indexer = {
      index: (_: number): Index => {
        if (isFirstCall) {
          isFirstCall = false;
          return { blockSize: 3, blockIndex: 0, blockNumber: 0 };
        } else {
          return { blockSize: 4, blockIndex: 0, blockNumber: 0 };
        }
      },
    };
    const io = new BlockIO(indexer, store);
    await expect(async () => {
      await io.save([1, 2].map(c));
    }).rejects.toThrow(
      [
        "inconsistent indexed block size for block 0:",
        "registered block size 3 is not equal to block size 4",
        "reported at 1970-01-02T00:00:00.000Z",
      ].join(" "),
    );
  });
});
