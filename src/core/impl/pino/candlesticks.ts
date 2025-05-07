import { logger } from "@/core/impl/pino/logger";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { CacheStore as ICacheStore } from "@/core/util/candlesticks";

const t2s = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

const candlesticksFromTo = (candlesticks: Candlestick[]): { from: string; to: string } => {
  if (!candlesticks || candlesticks.length === 0) {
    return { from: "-", to: "-" };
  }
  const from = t2s(candlesticks[0].timestamp);
  const to = t2s(candlesticks[candlesticks.length - 1].timestamp);
  return { from, to };
};

export class Fetcher implements IFetcher {
  constructor(
    private readonly prefix: string,
    private readonly fetcher: IFetcher,
  ) {}

  async fetchAround(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ at: t2s(timestamp) }, `> ${this.prefix}.fetchAround`);
    const candlesticks = await this.fetcher.fetchAround(timestamp);
    logger.debug(candlesticksFromTo(candlesticks), `< ${this.prefix}.fetchAround`);
    return candlesticks;
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ from: t2s(timestamp) }, `> ${this.prefix}.fetchForward`);
    const candlesticks = await this.fetcher.fetchForward(timestamp);
    logger.debug(candlesticksFromTo(candlesticks), `< ${this.prefix}.fetchForward`);
    return candlesticks;
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    logger.debug({ to: t2s(timestamp) }, `> ${this.prefix}.fetchBackward`);
    const candlesticks = await this.fetcher.fetchBackward(timestamp);
    logger.debug(candlesticksFromTo(candlesticks), `< ${this.prefix}.fetchBackward`);
    return candlesticks;
  }
}

export class CacheStore implements ICacheStore {
  constructor(
    private readonly prefix: string,
    private readonly cacheStore: ICacheStore,
  ) {}

  async load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]> {
    const from = t2s(fromTimestamp);
    const to = t2s(toTimestamp);
    logger.debug({ from, to }, `> ${this.prefix}.load`);
    const candlestickBlocks = await this.cacheStore.load(fromTimestamp, toTimestamp);
    const obj: any = {};
    if (candlestickBlocks) {
      obj["count"] = candlestickBlocks.length;
      for (let i = 0; i < candlestickBlocks.length; i++) {
        const blockFromTo = candlesticksFromTo(candlestickBlocks[i]);
        obj[`${i}from`] = blockFromTo.from;
        obj[`${i}to`] = blockFromTo.to;
      }
    }
    logger.debug(obj, `< ${this.prefix}.load`);
    return candlestickBlocks;
  }

  async save(candlesticks: Candlestick[]): Promise<void> {
    logger.debug(candlesticksFromTo(candlesticks), `> ${this.prefix}.save`);
    await this.cacheStore.save(candlesticks);
    logger.debug({}, `< ${this.prefix}.save`);
  }
}
