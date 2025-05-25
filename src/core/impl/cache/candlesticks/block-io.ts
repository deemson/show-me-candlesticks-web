import type { Candlestick } from "@/core/base/candlesticks";
import type { IO } from "@/core/impl/cache/candlesticks/fetcher";
import type { Interval } from "@/core/base/interval";
import { numberSinceEpochTimestamp } from "@/core/base/interval";

export class BlockIO implements IO {
  constructor(
    private readonly indexer: Indexer,
    private readonly store: Store,
  ) {}

  async load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    const fromBlockNumber = this.indexer.timestampToBlockNumber(fromTimestamp);
    const toBlockNumber = this.indexer.timestampToBlockNumber(toTimestamp);
    const blockMap = await this.store.load(fromBlockNumber, toBlockNumber);
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

  async save(candlesticks: Candlestick[]): Promise<void> {
    const blockMap = new Map<number, Candlestick[]>();
    for (const candlestick of candlesticks) {
      const blockNumber = this.indexer.timestampToBlockNumber(candlestick.timestamp);
      if (!blockMap.has(blockNumber)) {
        blockMap.set(blockNumber, []);
      }
      blockMap.get(blockNumber)?.push(candlestick);
    }
    await this.store.save(blockMap);
  }
}

export type BlockMap = Map<number, Candlestick[]>;

export interface Store {
  load(fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap>;
  save(blockMap: BlockMap): Promise<void>;
}

export interface Indexer {
  timestampToBlockNumber(timestamp: number): number;
}

export class FixedBlockSizeIndexer implements Indexer {
  private readonly blockSize: number;

  constructor(
    private readonly interval: Interval,
    blockSize: number,
  ) {
    this.blockSize = Math.floor(blockSize);
  }

  timestampToBlockNumber(timestamp: number): number {
    const n = numberSinceEpochTimestamp(this.interval, timestamp);
    return Math.floor(n / this.blockSize);
  }
}
