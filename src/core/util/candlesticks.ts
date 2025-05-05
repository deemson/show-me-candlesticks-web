import type {
  Candlestick,
  Fetcher as IFetcher,
  FetchAroundResult,
  FetchBackwardResult,
  FetchForwardResult,
} from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import * as intervalLib from "@/core/base/interval";

const dataFetchRequestLimit = 5;

export class CachingFetcher implements IFetcher {
  private readonly aroundForwardLimit: number;
  private readonly aroundBackwardLimit: number;
  private readonly forwardLimit: number;
  private readonly backwardLimit: number;

  constructor(
    private readonly interval: Interval,
    limit: number,
    private readonly store: CacheStore,
    private readonly dataFetcher: IFetcher,
  ) {
    this.aroundForwardLimit = Math.round((limit - 1) / 2);
    this.aroundBackwardLimit = Math.floor((limit - 1) / 2);
    this.forwardLimit = Math.floor(limit - 1);
    this.backwardLimit = Math.floor(limit - 1);
  }

  async fetchAround(timestamp: number): Promise<FetchAroundResult> {
    const date = new Date(timestamp);
    const fromDate = intervalLib.subtract(this.interval, date, this.aroundBackwardLimit);
    const toDate = intervalLib.add(this.interval, date, this.aroundForwardLimit);
    const candlesticks = await this.fetchDateRange(fromDate, toDate);
    const fetchBackwardResult = this.extractFetchBackwardResult(timestamp, candlesticks);
    const fetchForwardResult = this.extractFetchForwardResult(timestamp, candlesticks);
    let atTimestamp: Candlestick | null = null;
    if (fetchBackwardResult.atTimestamp !== null) {
      atTimestamp = fetchBackwardResult.atTimestamp;
    } else if (fetchForwardResult.atTimestamp !== null) {
      atTimestamp = fetchForwardResult.atTimestamp;
    }
    return {
      beforeTimestamp: fetchBackwardResult.beforeTimestamp,
      atTimestamp,
      afterTimestamp: fetchForwardResult.afterTimestamp,
    };
  }

  async fetchForward(timestamp: number): Promise<FetchForwardResult> {
    const fromDate = new Date(timestamp);
    const toDate = intervalLib.add(this.interval, fromDate, this.forwardLimit);
    const candlesticks = await this.fetchDateRange(fromDate, toDate);
    return this.extractFetchForwardResult(timestamp, candlesticks);
  }

  async fetchBackward(timestamp: number): Promise<FetchBackwardResult> {
    const toDate = new Date(timestamp);
    const fromDate = intervalLib.subtract(this.interval, toDate, this.backwardLimit);
    const candlesticks = await this.fetchDateRange(fromDate, toDate);
    return this.extractFetchBackwardResult(timestamp, candlesticks);
  }

  private async fetchDateRange(fromDate: Date, toDate: Date): Promise<Candlestick[]> {
    const candlestickBlocks = await this.store.load(fromDate.getTime(), toDate.getTime());
    if (candlestickBlocks.length === 0) {
      return [];
    }
    return [];
  }

  private async dataFetchMissingRange(fromDate: Date, toDate: Date, requestLimit: number): Promise<Candlestick[]> {
    return [];
  }

  private async dataFetchMissingHead(wantDate: Date, haveDate: Date, requestLimit: number): Promise<Candlestick[]> {
    let earliestDate = haveDate;
    let candlesticks: Candlestick[] = [];
    for (let i = 0; i < requestLimit; i++) {
      let candlestickBatch: Candlestick[] = [];
      const timestamp = intervalLib.subtract(this.interval, earliestDate, 1).getTime();
      const fetchBackwardResult = await this.dataFetcher.fetchBackward(timestamp);
    }
  }

  private extractFetchForwardResult(timestamp: number, candlesticks: Candlestick[]): FetchForwardResult {
    let atTimestamp: Candlestick | null = null;
    let afterTimestamp: Candlestick[] = [];
    for (let i = 0; i < candlesticks.length; i++) {
      if (candlesticks[i].timestamp === timestamp) {
        atTimestamp = candlesticks[i];
        continue;
      }
      if (candlesticks[i].timestamp > timestamp) {
        afterTimestamp = candlesticks.toSpliced(i);
      }
    }
    return { atTimestamp, afterTimestamp };
  }

  private extractFetchBackwardResult(timestamp: number, candlesticks: Candlestick[]): FetchBackwardResult {
    let atTimestamp: Candlestick | null = null;
    let beforeTimestamp: Candlestick[] = [];
    for (let i = candlesticks.length - 1; i >= 0; i++) {
      if (candlesticks[i].timestamp === timestamp) {
        atTimestamp = candlesticks[i];
        continue;
      }
      if (candlesticks[i].timestamp < timestamp) {
        beforeTimestamp = candlesticks.toSpliced(0, i + 1);
        break;
      }
    }
    return { beforeTimestamp, atTimestamp };
  }
}

export interface CacheStore {
  load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]>;
  save(candlesticks: Candlestick[]): Promise<void>;
}
