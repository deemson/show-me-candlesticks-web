import type { Candlestick } from "@/core/base/candlesticks";
import type { CacheStore as ICacheStore } from "@/core/util/candlesticks";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

export class FixedBlockSizeCacheStore implements ICacheStore {
  private readonly blockSize: number;
  private readonly store: Map<number, Candlestick[]>;

  constructor(
    private readonly interval: Interval,
    blockSize: number,
  ) {
    this.blockSize = Math.floor(blockSize);
    this.store = new Map<number, Candlestick[]>();
  }

  async load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    const fromBlock = this.timestampToBlockNumber(fromTimestamp);
    const toBlock = this.timestampToBlockNumber(toTimestamp);
    const candlestickBlocks: Candlestick[][] = [];
    if (this.store.has(fromBlock)) {
      const firstBlock = this.store.get(fromBlock) as Candlestick[];
      for (let i = 0; i < firstBlock.length; i++) {
        if (firstBlock[i].timestamp >= fromTimestamp) {
          candlestickBlocks.push(firstBlock.slice(i));
          break;
        }
      }
    } else {
      candlestickBlocks.push([]);
    }
    for (let i = fromBlock + 1; i < toBlock; i++) {
      if (!this.store.has(i)) {
        if (candlestickBlocks[candlestickBlocks.length - 1].length > 0) {
          candlestickBlocks.push([]);
        }
        continue;
      }
      const candlestickBlock = this.store.get(i) as Candlestick[];
      candlestickBlocks[candlestickBlocks.length - 1] = [
        ...candlestickBlocks[candlestickBlocks.length - 1],
        ...candlestickBlock,
      ];
    }
    if (this.store.has(toBlock)) {
      const lastBlock = this.store.get(toBlock) as Candlestick[];
      for (let i = 0; i < lastBlock.length; i++) {
        if (lastBlock[i].timestamp === toTimestamp) {
          candlestickBlocks[candlestickBlocks.length - 1] = [
            ...candlestickBlocks[candlestickBlocks.length - 1],
            ...lastBlock.slice(0, i + 1),
          ];
          break;
        }
        if (lastBlock[i].timestamp > toTimestamp) {
          candlestickBlocks[candlestickBlocks.length - 1] = [
            ...candlestickBlocks[candlestickBlocks.length - 1],
            ...lastBlock.slice(0, i),
          ];
          break;
        }
      }
    }
    if (candlestickBlocks[candlestickBlocks.length - 1].length === 0) {
      return candlestickBlocks.slice(0, -1);
    }
    return candlestickBlocks;
  }

  async save(candlesticks: Candlestick[]): Promise<void> {
    const updateMap = new Map<number, Candlestick[]>();
    for (const candlestick of candlesticks) {
      const blockNumber = this.timestampToBlockNumber(candlestick.timestamp);
      if (!updateMap.has(blockNumber)) {
        updateMap.set(blockNumber, []);
      }
      updateMap.get(blockNumber)?.push(candlestick);
    }
    for (const [key, value] of updateMap) {
      if (value.length === this.blockSize) {
        this.store.set(key, value);
      }
    }
  }

  private timestampToBlockNumber(timestamp: number): number {
    const n = intervalLib.numberSinceEpoch(this.interval, new UTCDate(timestamp));
    return Math.floor(n / this.blockSize);
  }
}
