import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import {
  addToDate,
  subtractFromDate,
  addToTimestamp,
  subtractFromTimestamp,
  numberSinceEpochTimestamp,
  addToEpochTimestamp,
} from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

type FetchType = "around" | "forward" | "backward";

export class Fetcher implements IFetcher {
  private readonly aroundForwardLimit: number;
  private readonly aroundBackwardLimit: number;
  private readonly forwardLimit: number;
  private readonly backwardLimit: number;

  constructor(
    private readonly dataFetcher: IFetcher,
    private readonly io: IO,
    limit: number,
  ) {
    this.aroundForwardLimit = Math.round((limit - 1) / 2);
    this.aroundBackwardLimit = Math.floor((limit - 1) / 2);
    this.forwardLimit = Math.floor(limit - 1);
    this.backwardLimit = Math.floor(limit - 1);
  }

  async fetchAround(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const n = numberSinceEpochTimestamp(interval, timestamp);
    let normalizedTimestamp = addToEpochTimestamp(interval, n);
    if (normalizedTimestamp < timestamp) {
      normalizedTimestamp = addToTimestamp(interval, normalizedTimestamp, 1);
    }
    const date = new UTCDate(normalizedTimestamp);
    const fromDate = subtractFromDate(interval, date, this.aroundBackwardLimit);
    const toDate = addToDate(interval, date, this.aroundForwardLimit);
    return this.fetchDateRange("around", symbol, interval, fromDate, toDate);
  }

  async fetchForward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const n = numberSinceEpochTimestamp(interval, timestamp);
    const normalizedTimestamp = addToEpochTimestamp(interval, n);
    const fromDate = new UTCDate(normalizedTimestamp);
    const toDate = addToDate(interval, fromDate, this.forwardLimit);
    return this.fetchDateRange("forward", symbol, interval, fromDate, toDate);
  }

  async fetchBackward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const n = numberSinceEpochTimestamp(interval, timestamp);
    let normalizedTimestamp = addToEpochTimestamp(interval, n);
    if (normalizedTimestamp < timestamp) {
      normalizedTimestamp = addToTimestamp(interval, normalizedTimestamp, 1);
    }
    const toDate = new UTCDate(normalizedTimestamp);
    const fromDate = subtractFromDate(interval, toDate, this.backwardLimit);
    return this.fetchDateRange("backward", symbol, interval, fromDate, toDate);
  }

  private async fetchDateRange(
    fetchType: FetchType,
    symbol: string,
    interval: Interval,
    fromDate: UTCDate,
    toDate: UTCDate,
  ): Promise<Candlestick[]> {
    const fromTimestamp = fromDate.getTime();
    const toTimestamp = toDate.getTime();
    const candlestickBlocks = await this.io.load(symbol, interval, fromTimestamp, toTimestamp);
    if (!candlestickBlocks || candlestickBlocks.length === 0) {
      let candlesticksRange: Candlestick[] = [];
      switch (fetchType) {
        case "around":
          candlesticksRange = await this.dataFetchAround(symbol, interval, fromTimestamp, toTimestamp);
          break;
        case "forward":
          candlesticksRange = await this.dataFetchForward(symbol, interval, fromTimestamp, toTimestamp);
          break;
        case "backward":
          candlesticksRange = await this.dataFetchBackward(symbol, interval, fromTimestamp, toTimestamp);
          break;
      }
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
    if (numberOfGaps === 0) {
      return candlestickBlocks[0];
    }
    if (isMissingHead) {
      const missingHeadTimestamp = subtractFromTimestamp(interval, firstCandlestick.timestamp, 1);
      const missingHead = await this.dataFetchBackward(symbol, interval, fromTimestamp, missingHeadTimestamp);
      return [...missingHead, ...candlestickBlocks[0]];
    }
    if (isMissingTail) {
      const missingTailTimestamp = addToTimestamp(interval, lastCandlestick.timestamp, 1);
      const missingTail = await this.dataFetchForward(symbol, interval, missingTailTimestamp, toTimestamp);
      return [...candlestickBlocks[0], ...missingTail];
    }
    const firstBlockLastTimestamp = (firstCandlestickBlock.at(-1) as Candlestick).timestamp;
    const lastBlockFirstTimestamp = lastCandlestickBlock[0].timestamp;
    const missingRangeFromTimestamp = addToTimestamp(interval, firstBlockLastTimestamp, 1);
    const missingRangeToTimestamp = subtractFromTimestamp(interval, lastBlockFirstTimestamp, 1);
    let missingRange: Candlestick[] = [];
    switch (fetchType) {
      case "around":
        missingRange = await this.dataFetchAround(symbol, interval, missingRangeFromTimestamp, missingRangeToTimestamp);
        break;
      case "forward":
        missingRange = await this.dataFetchForward(
          symbol,
          interval,
          missingRangeFromTimestamp,
          missingRangeToTimestamp,
        );
        break;
      case "backward":
        missingRange = await this.dataFetchBackward(
          symbol,
          interval,
          missingRangeFromTimestamp,
          missingRangeToTimestamp,
        );
        break;
    }
    return [...candlestickBlocks[0], ...missingRange, ...candlestickBlocks[1]];
  }

  private async dataFetchAround(
    symbol: string,
    interval: Interval,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<Candlestick[]> {
    const middleDate = new UTCDate((fromTimestamp + toTimestamp) / 2);
    const candlesticks = await this.dataFetcher.fetchAround(symbol, interval, middleDate.getTime());
    if (candlesticks && candlesticks.length > 0) {
      await this.io.save(symbol, interval, candlesticks);
    }
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
  }

  private async dataFetchForward(
    symbol: string,
    interval: Interval,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchForward(symbol, interval, fromTimestamp);
    await this.io.save(symbol, interval, candlesticks);
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
  }

  private async dataFetchBackward(
    symbol: string,
    interval: Interval,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchBackward(symbol, interval, toTimestamp);
    await this.io.save(symbol, interval, candlesticks);
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
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
    if (!isHeadFound) {
      if (candlesticks[iHead].timestamp >= fromTimestamp) {
        isHeadFound = true;
      } else {
        iHead++;
      }
    }
    if (!isTailFound) {
      if (candlesticks[iTail].timestamp <= toTimestamp) {
        isTailFound = true;
      } else {
        iTail--;
      }
    }
  }
  return candlesticks.slice(iHead, iTail + 1);
};

export interface IO {
  load(symbol: string, interval: Interval, fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]>;
  save(symbol: string, interval: Interval, candlesticks: Candlestick[]): Promise<void>;
}
