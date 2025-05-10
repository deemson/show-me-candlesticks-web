import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

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
    const date = new UTCDate(timestamp);
    const fromDate = intervalLib.subtract(this.interval, date, this.aroundBackwardLimit);
    const toDate = intervalLib.add(this.interval, date, this.aroundForwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    const fromDate = new UTCDate(timestamp);
    const toDate = intervalLib.add(this.interval, fromDate, this.forwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    const toDate = new UTCDate(timestamp);
    const fromDate = intervalLib.subtract(this.interval, toDate, this.backwardLimit);
    return this.fetchDateRange(fromDate, toDate);
  }

  private async fetchDateRange(fromDate: UTCDate, toDate: UTCDate): Promise<Candlestick[]> {
    const candlestickBlocks = await this.cacheStore.load(fromDate.getTime(), toDate.getTime());
    if (!candlestickBlocks || candlestickBlocks.length === 0) {
      const candlesticksRange = await this.dataFetchMissingRange(fromDate.getTime(), toDate.getTime());
      if (!candlesticksRange || candlesticksRange.length === 0) {
        throw Error("empty data range");
      }
      return candlesticksRange;
    }
    const firstCandlestickBlock = candlestickBlocks[0];
    const lastCandlestickBlock = candlestickBlocks.at(-1) as Candlestick[];
    const firstCandlestick = firstCandlestickBlock[0];
    const lastCandlestick = lastCandlestickBlock.at(-1) as Candlestick;
    const isMissingHead = firstCandlestick.timestamp > fromDate.getTime();
    const isMissingTail = lastCandlestick.timestamp < toDate.getTime();
    let numberOfGaps = 0;
    if (isMissingHead) {
      numberOfGaps++;
    }
    if (isMissingTail) {
      numberOfGaps++;
    }
    if (candlestickBlocks.length > 1) {
      numberOfGaps += candlestickBlocks.length - 1;
    }
    if (numberOfGaps > 1) {
      const msgInfo = [
        `N=${candlestickBlocks.length}`,
        `isMissingHead=${isMissingHead}`,
        `isMissingTail=${isMissingTail}`,
      ].join(" ");
      throw new Error(`more than 1 gap in cache results (${msgInfo})`);
    }
    if (isMissingHead) {
      const missingHead = await this.dataFetchMissingHead(firstCandlestick.timestamp, fromDate.getTime());
      return [...missingHead, ...candlestickBlocks[0]];
    }
    if (isMissingTail) {
      const missingTail = await this.dataFetchMissingTail(lastCandlestick.timestamp, toDate.getTime());
      return [...candlestickBlocks[0], ...missingTail];
    }
    if (candlestickBlocks.length === 1) {
      return candlestickBlocks[0];
    }
    const headTimestamp = (firstCandlestickBlock.at(-1) as Candlestick).timestamp;
    const tailTimestamp = lastCandlestickBlock[0].timestamp;
    const missingRange = await this.dataFetchMissingRange(headTimestamp, tailTimestamp);
    return [...candlestickBlocks[0], ...missingRange, ...candlestickBlocks[1]];
  }

  private async dataFetchMissingRange(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[]> {
    const middleDate = new UTCDate((fromTimestamp + toTimestamp) / 2);
    const candlesticks = await this.dataFetcher.fetchAround(middleDate.getTime());
    if (candlesticks && candlesticks.length > 0) {
      await this.cacheStore.save(candlesticks);
    }
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
  }

  private async dataFetchMissingHead(haveTimestamp: number, wantTimestamp: number): Promise<Candlestick[]> {
    const timestamp = intervalLib.subtract(this.interval, new UTCDate(haveTimestamp), 1).getTime();
    const candlesticks = await this.dataFetcher.fetchBackward(timestamp);
    await this.cacheStore.save(candlesticks);
    return sliceCandlesticksToDateRange(candlesticks, wantTimestamp, timestamp);
  }

  private async dataFetchMissingTail(haveTimestamp: number, wantTimestamp: number): Promise<Candlestick[]> {
    const timestamp = intervalLib.add(this.interval, new UTCDate(haveTimestamp), 1).getTime();
    const candlesticks = await this.dataFetcher.fetchForward(timestamp);
    await this.cacheStore.save(candlesticks);
    return sliceCandlesticksToDateRange(candlesticks, timestamp, wantTimestamp);
  }
}

const sliceCandlesticksToDateRange = (
  candlesticks: Candlestick[],
  fromTimestamp: number,
  toTimestamp: number,
): Candlestick[] => {
  let iHead = 0;
  let iTail = candlesticks.length - 1;
  let isHeadFound = false;
  let isTailFound = false;
  while (iHead < iTail) {
    if (isHeadFound && isTailFound) {
      break;
    }
    if (!isHeadFound && candlesticks[iHead].timestamp >= fromTimestamp) {
      isHeadFound = true;
    } else {
      iHead++;
    }
    if (!isTailFound && candlesticks[iTail].timestamp <= toTimestamp) {
      isTailFound = true;
    } else {
      iTail--;
    }
  }
  return candlesticks.slice(iHead, iTail + 1);
};

export interface CacheStore {
  load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]>;
  save(candlesticks: Candlestick[]): Promise<void>;
}
