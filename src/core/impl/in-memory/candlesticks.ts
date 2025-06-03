import type { Interval } from "@/core/base/interval";
import { toShortString } from "@/core/base/interval";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";
import { Mutex } from "async-mutex";

export type BlockCache = Map<string, Map<string, BlockMap>>;

export class BlockCacheStore implements IBlockCacheStore {
  readonly blockCache: BlockCache;
  private readonly mutex: Mutex;

  constructor() {
    this.blockCache = new Map();
    this.mutex = new Mutex();
  }

  async load(symbol: string, interval: Interval, fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    return await this.mutex.runExclusive(async () => {
      const blockMap: BlockMap = new Map();
      const cacheForSymbol = this.blockCache.get(symbol);
      if (cacheForSymbol === undefined) {
        return blockMap;
      }
      const cacheForSymbolAndInterval = cacheForSymbol.get(toShortString(interval));
      if (cacheForSymbolAndInterval === undefined) {
        return blockMap;
      }
      for (let i = fromBlockNumber; i <= toBlockNumber; i++) {
        const block = cacheForSymbolAndInterval.get(i);
        if (block !== undefined) {
          blockMap.set(i, block);
        }
      }
      return blockMap;
    });
  }

  async save(symbol: string, interval: Interval, blockMap: BlockMap): Promise<void> {
    await this.mutex.runExclusive(async () => {
      let cacheForSymbol = this.blockCache.get(symbol);
      if (cacheForSymbol === undefined) {
        cacheForSymbol = new Map();
        this.blockCache.set(symbol, cacheForSymbol);
      }
      let cacheForSymbolAndInterval = cacheForSymbol.get(toShortString(interval));
      if (cacheForSymbolAndInterval === undefined) {
        cacheForSymbolAndInterval = new Map();
        cacheForSymbol.set(toShortString(interval), cacheForSymbolAndInterval);
      }
      for (const [i, block] of blockMap.entries()) {
        cacheForSymbolAndInterval.set(i, block);
      }
    });
  }
}
