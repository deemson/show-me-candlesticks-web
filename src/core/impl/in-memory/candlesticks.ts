import type { Candlestick } from "@/core/base/candlesticks";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";
import { Mutex } from "async-mutex";

export type BrowserConsoleCache = BrowserConsoleCacheItem[];

export class BrowserConsoleCacheItem {
  constructor(readonly block: Candlestick[]) {}

  valueOf() {
    return "ssssup";
  }
}

export class ChromeDevConsoleReadyStore implements IBlockCacheStore {
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
          blockMap.set(i, cacheItem.block);
        }
      }
      return blockMap;
    });
  }

  async save(blockMap: BlockMap): Promise<void> {
    await this.mutex.runExclusive(async () => {
      for (const [i, v] of blockMap.entries()) {
        this.cache[i] = new BrowserConsoleCacheItem(v);
      }
    });
  }
}
