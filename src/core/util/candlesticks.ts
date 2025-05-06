import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";

export class CachingFetcher implements IFetcher {
  private readonly aroundForwardLimit: number;
  private readonly aroundBackwardLimit: number;
  private readonly forwardLimit: number;
  private readonly backwardLimit: number;

  constructor(
    private readonly interval: Interval,
    limit: number,
    private readonly cacheStore: CacheStore,
    private readonly dataFetcher: IFetcher,
  ) {
    this.aroundForwardLimit = Math.round((limit - 1) / 2);
    this.aroundBackwardLimit = Math.floor((limit - 1) / 2);
    this.forwardLimit = Math.floor(limit - 1);
    this.backwardLimit = Math.floor(limit - 1);
  }

  async fetchAround(timestamp: number): Promise<Candlestick[]> {
    const date = new Date(timestamp);
    const fromDate = intervalLib.subtract(this.interval, date, this.aroundBackwardLimit);
    const toDate = intervalLib.add(this.interval, date, this.aroundForwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    const fromDate = new Date(timestamp);
    const toDate = intervalLib.add(this.interval, fromDate, this.forwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    const toDate = new Date(timestamp);
    const fromDate = intervalLib.subtract(this.interval, toDate, this.backwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  private async fetchDateRange(fromDate: Date, toDate: Date): Promise<Candlestick[]> {
    const candlestickBlocks = await this.cacheStore.load(fromDate.getTime(), toDate.getTime());
    if (!candlestickBlocks || candlestickBlocks.length === 0) {
      const candlesticksRange = await this.dataFetchMissingRange(fromDate, toDate);
      if (!candlesticksRange || candlesticksRange.length === 0) {
        throw Error("empty data range");
      }
      return candlesticksRange;
    }
    switch (candlestickBlocks.length) {
      case 1:
        const candlesticksFromBlock = candlestickBlocks[0];
        const isMissingHead = candlesticksFromBlock[0].timestamp > fromDate.getTime();
        const isMissingTail = candlesticksFromBlock[candlesticksFromBlock.length - 1].timestamp < toDate.getTime();
        if (isMissingHead && isMissingTail) {
          throw Error("candlestick block missing both head & tail");
        }
        if (isMissingHead) {
          const haveDate = new Date(candlesticksFromBlock[0].timestamp);
          const headDate = intervalLib.subtract(this.interval, haveDate, 1);
          const candlesticksHead = await this.dataFetchMissingHead(headDate);
          return [...candlesticksHead, ...candlesticksFromBlock];
        }
        if (isMissingTail) {
          const haveDate = new Date(candlesticksFromBlock[candlesticksFromBlock.length - 1].timestamp);
          const tailDate = intervalLib.add(this.interval, haveDate, 1);
          const candlesticksTail = await this.dataFetchMissingTail(tailDate);
          return [...candlesticksFromBlock, ...candlesticksTail];
        }
        return candlesticksFromBlock;
      case 2:
        const [candlesticksHead, candlesticksTail] = candlestickBlocks;
        if (candlesticksHead[0].timestamp > fromDate.getTime()) {
          throw Error("2 candlestick blocks missing head");
        }
        if (candlesticksTail[candlesticksTail.length - 1].timestamp < toDate.getTime()) {
          throw Error("2 candlestick blocks missing tail");
        }
        const missingFromDate = intervalLib.add(this.interval, fromDate, 1);
        const missingToDate = intervalLib.subtract(this.interval, toDate, 1);
        const candlesticksInBetween = await this.dataFetchMissingRange(missingFromDate, missingToDate);
        return [...candlesticksHead, ...candlesticksInBetween, ...candlesticksTail];
      default:
        throw Error("more than 2 candlestick blocks");
    }
  }

  private async dataFetchMissingRange(fromDate: Date, toDate: Date): Promise<Candlestick[]> {
    const middleDate = new Date((fromDate.getTime() + toDate.getTime()) / 2);
    const candlesticks = await this.dataFetcher.fetchAround(middleDate.getTime());
    if (candlesticks && candlesticks.length > 0) {
      await this.cacheStore.save(candlesticks);
    }
    return candlesticks;
  }

  private async dataFetchMissingHead(date: Date): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchBackward(date.getTime());
    await this.cacheStore.save(candlesticks);
    return candlesticks;
  }

  private async dataFetchMissingTail(date: Date): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchForward(date.getTime());
    await this.cacheStore.save(candlesticks);
    return candlesticks;
  }
}

export interface CacheStore {
  load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]>;
  save(candlesticks: Candlestick[]): Promise<void>;
}
