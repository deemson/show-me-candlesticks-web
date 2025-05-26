import { logger } from "@/core/impl/pino/logger";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { IO as ICacheIO } from "@/core/impl/cache/candlesticks/fetcher";
import type {
  Indexer as IBlockCacheIndexer,
  Store as IBlockCacheStore,
  BlockMap,
} from "@/core/impl/cache/candlesticks/block-io";
import { UTCDate } from "@date-fns/utc";

const t2s = (timestamp: number): string => {
  return new UTCDate(timestamp).toISOString();
};

const ts2s = (fromTimestamp: number, toTimestamp: number): string => {
  const from = t2s(fromTimestamp);
  const to = t2s(toTimestamp);
  return `${from} - ${to}`;
};

const cs2s = (candlesticks: Candlestick[]): string => {
  if (!candlesticks || candlesticks.length === 0) {
    return "- - -";
  }
  const fromTimestamp = candlesticks[0].timestamp;
  const toTimestamp = candlesticks[candlesticks.length - 1].timestamp;
  return ts2s(fromTimestamp, toTimestamp);
};

const bm2sa = (blockMap: BlockMap): string[] => {
  const keys = blockMap.keys().toArray();
  keys.sort();
  const arr: string[] = [];
  for (const [k, v] of blockMap.entries()) {
    arr[k] = cs2s(v);
  }
  return arr;
};

export class Fetcher implements IFetcher {
  constructor(
    private readonly prefix: string,
    private readonly fetcher: IFetcher,
  ) {}

  async fetchAround(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ at: t2s(timestamp) }, `> ${this.prefix}.fetchAround`);
    const candlesticks = await this.fetcher.fetchAround(timestamp);
    logger.debug({ range: cs2s(candlesticks) }, `< ${this.prefix}.fetchAround`);
    return candlesticks;
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ from: t2s(timestamp) }, `> ${this.prefix}.fetchForward`);
    const candlesticks = await this.fetcher.fetchForward(timestamp);
    logger.debug({ range: cs2s(candlesticks) }, `< ${this.prefix}.fetchForward`);
    return candlesticks;
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ to: t2s(timestamp) }, `> ${this.prefix}.fetchBackward`);
    const candlesticks = await this.fetcher.fetchBackward(timestamp);
    logger.debug({ range: cs2s(candlesticks) }, `< ${this.prefix}.fetchBackward`);
    return candlesticks;
  }
}

export class CacheIO implements ICacheIO {
  constructor(
    private readonly prefix: string,
    private readonly io: ICacheIO,
  ) {}

  async load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    logger.debug({ range: ts2s(fromTimestamp, toTimestamp) }, `> ${this.prefix}.load`);
    const candlestickBlocks = await this.io.load(fromTimestamp, toTimestamp);
    logger.debug({ ranges: candlestickBlocks.map(cs2s) }, `< ${this.prefix}.load`);
    return candlestickBlocks;
  }

  async save(candlesticks: Candlestick[]): Promise<void> {
    logger.debug({ range: cs2s(candlesticks) }, `> ${this.prefix}.save`);
    await this.io.save(candlesticks);
    logger.debug({}, `< ${this.prefix}.save`);
  }
}

export class BlockCacheStore implements IBlockCacheStore {
  constructor(
    private readonly prefix: string,
    private readonly store: IBlockCacheStore,
  ) {}

  async load(fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    logger.debug({ range: `${fromBlockNumber} - ${toBlockNumber}` }, `> ${this.prefix}.load`);
    const blockMap = await this.store.load(fromBlockNumber, toBlockNumber);
    logger.debug({ ranges: bm2sa(blockMap) }, `< ${this.prefix}.load`);
    return blockMap;
  }
  async save(blockMap: BlockMap): Promise<void> {
    logger.debug({ ranges: bm2sa(blockMap) }, `> ${this.prefix}.save`);
    await this.store.save(blockMap);
    logger.debug({}, `< ${this.prefix}.save`);
  }
}
