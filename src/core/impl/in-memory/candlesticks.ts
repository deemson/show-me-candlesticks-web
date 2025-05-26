import type { Candlestick } from "@/core/base/candlesticks";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";
import { UTCDate } from "@date-fns/utc";
import { Mutex } from "async-mutex";

export type BrowserConsoleCache = BrowserConsoleCacheItem[];

export interface BrowserConsoleCacheItem {
  range: string;
  candlesticks: Candlestick[];
}

const cs2cis = (candlesticks: Candlestick[]): BrowserConsoleCacheItem => {
  const from = new UTCDate(candlesticks[0].timestamp).toISOString();
  const to = new UTCDate((candlesticks.at(-1) as Candlestick).timestamp).toISOString();
  return {
    range: `${from} - ${to}`,
    candlesticks: candlesticks,
  };
};

export class BrowserConsoleCacheStore implements IBlockCacheStore {
  private readonly mutex: Mutex;

  constructor(private readonly cache: BrowserConsoleCache) {
    this.mutex = new Mutex();
  }

  async load(fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    return await this.mutex.runExclusive(async () => {
      const blockMap: BlockMap = new Map();
      for (let i = fromBlockNumber; i <= toBlockNumber; i++) {
        const cacheItem = this.cache[i];
        if (cacheItem !== undefined) {
          blockMap.set(i, cacheItem.candlesticks);
        }
      }
      return blockMap;
    });
  }

  async save(blockMap: BlockMap): Promise<void> {
    await this.mutex.runExclusive(async () => {
      for (const [i, v] of blockMap.entries()) {
        this.cache[i] = cs2cis(v);
      }
    });
  }
}
