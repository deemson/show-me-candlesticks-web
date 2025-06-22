import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { IO as ICacheIO } from "@/core/impl/cache/candlesticks/fetcher";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";
import { toShortString, type Interval } from "@/core/base/interval";
import { rootLogger, Logger } from "@/core/lib/logging";
import { UTCDate } from "@date-fns/utc";

export class Fetcher implements IFetcher {
  private readonly logger: Logger;

  constructor(
    name: string,
    private readonly fetcher: IFetcher,
  ) {
    this.logger = rootLogger.child(name);
  }

  async fetchAround(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const logger = this.logger.child("fetchAround");
    this.logCall(logger, symbol, interval, timestamp);
    const candlesticks = await this.fetcher.fetchAround(symbol, interval, timestamp);
    this.logReturn(logger, symbol, interval, candlesticks);
    return candlesticks;
  }

  async fetchForward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const logger = this.logger.child("fetchForward");
    this.logCall(logger, symbol, interval, timestamp);
    const candlesticks = await this.fetcher.fetchForward(symbol, interval, timestamp);
    this.logReturn(logger, symbol, interval, candlesticks);
    return candlesticks;
  }

  async fetchBackward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const logger = this.logger.child("fetchBackward");
    this.logCall(logger, symbol, interval, timestamp);
    const candlesticks = await this.fetcher.fetchBackward(symbol, interval, timestamp);
    this.logReturn(logger, symbol, interval, candlesticks);
    return candlesticks;
  }

  private logCall(logger: Logger, symbol: string, interval: Interval, timestamp: number) {
    logger.debug(["call", `${symbol} ${toShortString(interval)}`, new UTCDate(timestamp).toISOString()].join("\n"));
  }

  private logReturn(logger: Logger, symbol: string, interval: Interval, candlesticks: Candlestick[]) {
    let start = "-";
    let end = "-";
    if (candlesticks.length > 0) {
      start = new UTCDate(candlesticks[0].timestamp).toISOString();
      end = new UTCDate(candlesticks[candlesticks.length - 1].timestamp).toISOString();
    }
    logger.debug(
      ["return", `${symbol} ${toShortString(interval)}`, `${candlesticks.length}: ${start} - ${end}`].join("\n"),
    );
  }
}

export class CacheIO implements ICacheIO {
  private readonly logger: Logger;

  constructor(
    name: string,
    private readonly io: ICacheIO,
  ) {
    this.logger = rootLogger.child(name);
  }

  async load(symbol: string, interval: Interval, fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    const logger = this.logger.child("load");
    const start = new UTCDate(fromTimestamp).toISOString();
    const end = new UTCDate(toTimestamp).toISOString();
    logger.debug(["call", `${symbol} ${toShortString(interval)}`, `${start} - ${end}`].join("\n"));
    const candlestickBlocks = await this.io.load(symbol, interval, fromTimestamp, toTimestamp);
    const returnLines = [];
    for (const candlestickBlock of candlestickBlocks) {
      let blockStart = "-";
      let blockEnd = "-";
      if (candlestickBlock.length > 0) {
        blockStart = new UTCDate(candlestickBlock[0].timestamp).toISOString();
        blockEnd = new UTCDate(candlestickBlock[candlestickBlock.length - 1].timestamp).toISOString();
      }
      returnLines.push(`${candlestickBlock.length}: ${blockStart} - ${blockEnd}`);
    }
    logger.debug(["return", `${symbol} ${toShortString(interval)}`, ...returnLines].join("\n"));
    return candlestickBlocks;
  }

  async save(symbol: string, interval: Interval, candlesticks: Candlestick[]): Promise<void> {
    const logger = this.logger.child("load");
    let start = "-";
    let end = "-";
    if (candlesticks.length > 0) {
      start = new UTCDate(candlesticks[0].timestamp).toISOString();
      end = new UTCDate(candlesticks[candlesticks.length - 1].timestamp).toISOString();
    }
    logger.debug(
      ["call", `${symbol} ${toShortString(interval)}`, `${candlesticks.length}: ${start} - ${end}`].join("\n"),
    );
    await this.io.save(symbol, interval, candlesticks);
    logger.debug("return");
  }
}

export class BlockCacheStore implements IBlockCacheStore {
  private readonly logger: Logger;

  constructor(
    name: string,
    private readonly store: IBlockCacheStore,
  ) {
    this.logger = rootLogger.child(name);
  }

  async load(symbol: string, interval: Interval, fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    const logger = this.logger.child("load");
    logger.debug(["call", `${symbol} ${toShortString(interval)}`, `${fromBlockNumber} - ${toBlockNumber}`].join("\n"));
    const blockMap = await this.store.load(symbol, interval, fromBlockNumber, toBlockNumber);
    logger.debug(["return", `${symbol} ${toShortString(interval)}`, ...this.blockMapLines(blockMap)].join("\n"));
    return blockMap;
  }

  async save(symbol: string, interval: Interval, blockMap: BlockMap): Promise<void> {
    const logger = this.logger.child("save");
    logger.debug(["call", `${symbol} ${toShortString(interval)}`, ...this.blockMapLines(blockMap)].join("\n"));
    await this.store.save(symbol, interval, blockMap);
    logger.debug("return");
  }

  private blockMapLines(blockMap: BlockMap): string[] {
    const keys = blockMap.keys().toArray();
    keys.sort();
    const arr: string[] = [];
    for (const [k, v] of blockMap.entries()) {
      let start = "-";
      let end = "-";
      if (v.length > 0) {
        start = new UTCDate(v[0].timestamp).toISOString();
        end = new UTCDate(v[v.length - 1].timestamp).toISOString();
      }
      arr.push(`#${k} ${v.length}: ${start} - ${end}`);
    }
    return arr;
  }
}
