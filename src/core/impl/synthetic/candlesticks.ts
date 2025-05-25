import type { Interval } from "@/core/base/interval";
import {
  addToDate,
  subtractFromDate,
  addToEpochDate,
  numberSinceEpochDate
} from "@/core/base/interval";
import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import { UTCDate } from "@date-fns/utc";

const possibleValues: { o: number; c: number; l: number; h: number }[] = [
  { o: 20, c: 40, l: 15, h: 45 },
  { o: 40, c: 30, l: 25, h: 50 },
  { o: 30, c: 40, l: 35, h: 45 },
  { o: 40, c: 35, l: 30, h: 50 },
  { o: 35, c: 50, l: 30, h: 55 },
  { o: 50, c: 20, l: 10, h: 60 },
];
const possibleVolumes: number[] = [80, 120, 100];

const makeCandlestick = (interval: Interval, date: UTCDate): Candlestick => {
  const n = numberSinceEpochDate(interval, date);
  const { o, c, l, h } = possibleValues[n % possibleValues.length];
  const volume = possibleVolumes[n % possibleVolumes.length];
  return {
    timestamp: addToEpochDate(interval, n).getTime(),
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

  async fetchAround(timestamp: number): Promise<Candlestick[]> {
    const date = new UTCDate(timestamp);
    const candlesticks: Candlestick[] = [];
    for (let i = this.aroundBackwardBatchSize; i >= 1; i--) {
      candlesticks.push(makeCandlestick(this.interval, subtractFromDate(this.interval, date, i)));
    }
    for (let i = 0; i <= this.aroundForwardBatchSize; i++) {
      candlesticks.push(makeCandlestick(this.interval, addToDate(this.interval, date, i)));
    }
    return candlesticks;
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    const date = new UTCDate(timestamp);
    const candlesticks: Candlestick[] = [];
    for (let i = 0; i <= this.forwardBatchSize; i++) {
      candlesticks.push(makeCandlestick(this.interval, addToDate(this.interval, date, i)));
    }
    return candlesticks;
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    const date = new UTCDate(timestamp);
    const candlesticks: Candlestick[] = [];
    for (let i = this.backwardBatchSize; i >= 0; i--) {
      candlesticks.push(makeCandlestick(this.interval, subtractFromDate(this.interval, date, i)));
    }
    return candlesticks;
  }
}
