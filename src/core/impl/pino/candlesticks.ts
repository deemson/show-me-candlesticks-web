import { logger } from "@/core/impl/pino/logger";
import type { Interval } from "@/core/base/interval";
import { toShortString } from "@/core/base/interval";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { IO as ICacheIO } from "@/core/impl/cache/candlesticks/fetcher";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";
import { UTCDate } from "@date-fns/utc";

const logAttrTimestamp = (timestamp: number): string => {
  return new UTCDate(timestamp).toISOString();
};

const logAttrFromToTimestampRange = (fromTimestamp: number, toTimestamp: number): string => {
  const from = logAttrTimestamp(fromTimestamp);
  const to = logAttrTimestamp(toTimestamp);
  return `${from} - ${to}`;
};

const logAttrCandlesticksTimeRange = (candlesticks: Candlestick[]): string => {
  if (!candlesticks || candlesticks.length === 0) {
    return "- - -";
  }
  const fromTimestamp = candlesticks[0].timestamp;
  const toTimestamp = candlesticks[candlesticks.length - 1].timestamp;
  return logAttrFromToTimestampRange(fromTimestamp, toTimestamp);
};

const logAttrBlockMapTimeRanges = (blockMap: BlockMap): string[] => {
  const keys = blockMap.keys().toArray();
  keys.sort();
  const arr: string[] = [];
  for (const [k, v] of blockMap.entries()) {
    arr[k] = logAttrCandlesticksTimeRange(v);
  }
  return arr;
};

export class Fetcher implements IFetcher {
  constructor(
    private readonly prefix: string,
    private readonly fetcher: IFetcher,
  ) {}

  async fetchAround(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        at: logAttrTimestamp(timestamp),
      },
      `> ${this.prefix}.fetchAround`,
    );
    const candlesticks = await this.fetcher.fetchAround(symbol, interval, timestamp);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrCandlesticksTimeRange(candlesticks),
      },
      `< ${this.prefix}.fetchAround`,
    );
    return candlesticks;
  }

  async fetchForward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        from: logAttrTimestamp(timestamp),
      },
      `> ${this.prefix}.fetchForward`,
    );
    const candlesticks = await this.fetcher.fetchForward(symbol, interval, timestamp);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrCandlesticksTimeRange(candlesticks),
      },
      `< ${this.prefix}.fetchForward`,
    );
    return candlesticks;
  }

  async fetchBackward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        to: logAttrTimestamp(timestamp),
      },
      `> ${this.prefix}.fetchBackward`,
    );
    const candlesticks = await this.fetcher.fetchBackward(symbol, interval, timestamp);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrCandlesticksTimeRange(candlesticks),
      },
      `< ${this.prefix}.fetchBackward`,
    );
    return candlesticks;
  }
}

export class CacheIO implements ICacheIO {
  constructor(
    private readonly prefix: string,
    private readonly io: ICacheIO,
  ) {}

  async load(symbol: string, interval: Interval, fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrFromToTimestampRange(fromTimestamp, toTimestamp),
      },
      `> ${this.prefix}.load`,
    );
    const candlestickBlocks = await this.io.load(symbol, interval, fromTimestamp, toTimestamp);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        ranges: candlestickBlocks.map(logAttrCandlesticksTimeRange),
      },
      `< ${this.prefix}.load`,
    );
    return candlestickBlocks;
  }

  async save(symbol: string, interval: Interval, candlesticks: Candlestick[]): Promise<void> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrCandlesticksTimeRange(candlesticks),
      },
      `> ${this.prefix}.save`,
    );
    await this.io.save(symbol, interval, candlesticks);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: logAttrCandlesticksTimeRange(candlesticks),
      },
      `< ${this.prefix}.save`,
    );
  }
}

export class BlockCacheStore implements IBlockCacheStore {
  constructor(
    private readonly prefix: string,
    private readonly store: IBlockCacheStore,
  ) {}

  async load(symbol: string, interval: Interval, fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        range: `${fromBlockNumber} - ${toBlockNumber}`,
      },
      `> ${this.prefix}.load`,
    );
    const blockMap = await this.store.load(symbol, interval, fromBlockNumber, toBlockNumber);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        ranges: logAttrBlockMapTimeRanges(blockMap),
      },
      `< ${this.prefix}.load`,
    );
    return blockMap;
  }
  async save(symbol: string, interval: Interval, blockMap: BlockMap): Promise<void> {
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        ranges: logAttrBlockMapTimeRanges(blockMap),
      },
      `> ${this.prefix}.save`,
    );
    await this.store.save(symbol, interval, blockMap);
    logger.debug(
      {
        symbol,
        interval: toShortString(interval),
        ranges: logAttrBlockMapTimeRanges(blockMap),
      },
      `< ${this.prefix}.save`,
    );
  }
}
