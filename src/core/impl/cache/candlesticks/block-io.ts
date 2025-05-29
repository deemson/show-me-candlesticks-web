import type { Candlestick } from "@/core/base/candlesticks";
import type { IO } from "@/core/impl/cache/candlesticks/fetcher";
import type { Interval } from "@/core/base/interval";
import { numberSinceEpochTimestamp } from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

export class BlockIO implements IO {
  constructor(
    private readonly indexer: Indexer,
    private readonly store: Store,
  ) {}

  async load(symbol: string, interval: Interval, fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    const fromBlockNumber = this.indexer.index(interval, fromTimestamp).blockNumber;
    const toBlockNumber = this.indexer.index(interval, toTimestamp).blockNumber;
    const blockMap = await this.store.load(symbol, interval, fromBlockNumber, toBlockNumber);
    const blocks: Candlestick[][] = [];
    if (blockMap.has(fromBlockNumber)) {
      const firstBlock = blockMap.get(fromBlockNumber) as Candlestick[];
      for (let i = 0; i < firstBlock.length; i++) {
        if (firstBlock[i].timestamp >= fromTimestamp) {
          blocks.push(firstBlock.slice(i));
          break;
        }
      }
    } else {
      blocks.push([]);
    }
    for (let i = fromBlockNumber + 1; i < toBlockNumber; i++) {
      if (!blockMap.has(i)) {
        if (blocks[blocks.length - 1].length > 0) {
          blocks.push([]);
        }
        continue;
      }
      const candlestickBlock = blockMap.get(i) as Candlestick[];
      blocks[blocks.length - 1] = [...blocks[blocks.length - 1], ...candlestickBlock];
    }
    if (blockMap.has(toBlockNumber)) {
      const lastBlock = blockMap.get(toBlockNumber) as Candlestick[];
      for (let i = 0; i < lastBlock.length; i++) {
        if (lastBlock[i].timestamp === toTimestamp) {
          blocks[blocks.length - 1] = [...blocks[blocks.length - 1], ...lastBlock.slice(0, i + 1)];
          break;
        }
        if (lastBlock[i].timestamp > toTimestamp) {
          blocks[blocks.length - 1] = [...blocks[blocks.length - 1], ...lastBlock.slice(0, i)];
          break;
        }
      }
    }
    if (blocks[blocks.length - 1].length === 0) {
      return blocks.slice(0, -1);
    }
    return blocks;
  }

  async save(symbol: string, interval: Interval, candlesticks: Candlestick[]): Promise<void> {
    const blockDefs = new Map<number, { blockSize: number; candlesticks: Candlestick[] }>();
    for (const candlestick of candlesticks) {
      const { blockNumber, blockIndex, blockSize } = this.indexer.index(interval, candlestick.timestamp);
      if (!blockDefs.has(blockNumber)) {
        if (blockIndex !== 0) {
          continue;
        }
        blockDefs.set(blockNumber, { blockSize, candlesticks: [candlestick] });
      } else {
        if (blockSize !== blockDefs.get(blockNumber)?.blockSize) {
          throw new Error(
            [
              `inconsistent indexed block size for block ${blockNumber}:`,
              `registered block size ${blockDefs.get(blockNumber)?.blockSize}`,
              `is not equal to block size ${blockSize}`,
              `reported at ${new UTCDate(candlestick.timestamp).toISOString()}`,
            ].join(" "),
          );
        }
        if (blockIndex !== blockDefs.get(blockNumber)?.candlesticks.length) {
          throw new Error(
            [
              `non-contiguous cache for block ${blockNumber}:`,
              `received index ${blockIndex}`,
              `after index ${(blockDefs.get(blockNumber)?.candlesticks.length as number) - 1}`,
              `reported at ${new UTCDate(candlestick.timestamp).toISOString()}`,
            ].join(" "),
          );
        }
        blockDefs.get(blockNumber)?.candlesticks.push(candlestick);
      }
    }
    const blockMap = new Map<number, Candlestick[]>();
    for (const [blockNumber, { blockSize, candlesticks }] of blockDefs.entries()) {
      if (candlesticks.length === blockSize) {
        blockMap.set(blockNumber, candlesticks);
      }
    }
    await this.store.save(symbol, interval, blockMap);
  }
}

export type BlockMap = Map<number, Candlestick[]>;

export interface Store {
  load(symbol: string, interval: Interval, fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap>;
  save(symbol: string, interval: Interval, blockMap: BlockMap): Promise<void>;
}

export interface Index {
  blockNumber: number;
  blockIndex: number;
  blockSize: number;
}

export interface Indexer {
  index(interval: Interval, timestamp: number): Index;
}

export class FixedBlockSizeIndexer implements Indexer {
  private readonly blockSize: number;

  constructor(blockSize: number) {
    this.blockSize = Math.floor(blockSize);
  }

  index(interval: Interval, timestamp: number): Index {
    const n = numberSinceEpochTimestamp(interval, timestamp);
    return {
      blockNumber: Math.floor(n / this.blockSize),
      blockIndex: n % this.blockSize,
      blockSize: this.blockSize,
    };
  }
}
