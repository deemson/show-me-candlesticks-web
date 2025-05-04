import type { Interval } from "@/core/base/interval";
import {
  add as addInterval,
  subtract as subtractInterval,
  addToEpoch as addIntervalToEpoch,
  numberSinceEpoch as intervalNumberSinceEpoch,
} from "@/core/base/interval";
import type {
  Candlestick,
  Fetcher as IFetcher,
  FetchAroundResult,
  FetchBackwardResult,
  FetchForwardResult,
} from "@/core/base/candlesticks";

const possibleValues: { o: number; c: number; l: number; h: number }[] = [
  { o: 20, c: 40, l: 15, h: 45 },
  { o: 40, c: 30, l: 25, h: 50 },
  { o: 30, c: 40, l: 35, h: 45 },
  { o: 40, c: 35, l: 30, h: 50 },
  { o: 35, c: 50, l: 30, h: 55 },
  { o: 50, c: 20, l: 10, h: 60 },
];
const possibleVolumes: number[] = [80, 120, 100];

const makeCandlestick = (interval: Interval, date: Date): Candlestick => {
  const n = intervalNumberSinceEpoch(interval, date);
  const { o, c, l, h } = possibleValues[n % possibleValues.length];
  const volume = possibleVolumes[n % possibleVolumes.length];
  return {
    timestamp: addIntervalToEpoch(interval, n).getTime(),
    open: o,
    high: h,
    low: l,
    close: c,
    volume,
  };
};

export class Fetcher implements IFetcher {
  private readonly aroundForwardBatchSize: number;
  private readonly aroundBackwardBatchSize: number;
  private readonly forwardBatchSize: number;
  private readonly backwardBatchSize: number;

  constructor(
    batchSize: number,
    private readonly interval: Interval,
  ) {
    this.aroundForwardBatchSize = Math.round((batchSize - 1) / 2);
    this.aroundBackwardBatchSize = Math.floor((batchSize - 1) / 2);
    this.forwardBatchSize = Math.floor(batchSize - 1);
    this.backwardBatchSize = Math.floor(batchSize - 1);
  }

  async fetchAround(timestamp: number): Promise<FetchAroundResult> {
    const date = new Date(timestamp);
    const atTimestamp = makeCandlestick(this.interval, date);
    const afterTimestamp: Candlestick[] = [];
    for (let i = 1; i <= this.aroundForwardBatchSize; i++) {
      afterTimestamp.push(makeCandlestick(this.interval, addInterval(this.interval, date, i)));
    }
    const beforeTimestamp: Candlestick[] = [];
    for (let i = this.aroundBackwardBatchSize; i >= 1; i--) {
      beforeTimestamp.push(makeCandlestick(this.interval, subtractInterval(this.interval, date, i)));
    }
    return { afterTimestamp, atTimestamp, beforeTimestamp };
  }

  async fetchForward(timestamp: number): Promise<FetchForwardResult> {
    const date = new Date(timestamp);
    const atTimestamp = makeCandlestick(this.interval, date);
    const afterTimestamp: Candlestick[] = [];
    for (let i = 1; i <= this.forwardBatchSize; i++) {
      afterTimestamp.push(makeCandlestick(this.interval, addInterval(this.interval, date, i)));
    }
    return { atTimestamp, afterTimestamp };
  }

  async fetchBackward(timestamp: number): Promise<FetchBackwardResult> {
    const date = new Date(timestamp);
    const atTimestamp = makeCandlestick(this.interval, date);
    const beforeTimestamp: Candlestick[] = [];
    for (let i = this.backwardBatchSize; i >= 1; i--) {
      beforeTimestamp.push(makeCandlestick(this.interval, subtractInterval(this.interval, date, i)));
    }
    return { atTimestamp, beforeTimestamp };
  }
}
