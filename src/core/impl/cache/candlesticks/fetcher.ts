import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import { addToDate, subtractFromDate, addToTimestamp, subtractFromTimestamp } from "@/core/base/interval";
import { UTCDate } from "@date-fns/utc";

type FetchType = "around" | "forward" | "backward";

export class Fetcher implements IFetcher {
  private readonly aroundForwardLimit: number;
  private readonly aroundBackwardLimit: number;
  private readonly forwardLimit: number;
  private readonly backwardLimit: number;

  constructor(
    private readonly interval: Interval,
    limit: number,
    private readonly store: Store,
    private readonly dataFetcher: IFetcher,
  ) {
    this.aroundForwardLimit = Math.round((limit - 1) / 2);
    this.aroundBackwardLimit = Math.floor((limit - 1) / 2);
    this.forwardLimit = Math.floor(limit - 1);
    this.backwardLimit = Math.floor(limit - 1);
  }

  async fetchAround(timestamp: number): Promise<Candlestick[]> {
    const date = new UTCDate(timestamp);
    const fromDate = subtractFromDate(this.interval, date, this.aroundBackwardLimit);
    const toDate = addToDate(this.interval, date, this.aroundForwardLimit);
    return this.fetchDateRange("around", fromDate, toDate);
  }

  async fetchForward(timestamp: number): Promise<Candlestick[]> {
    const fromDate = new UTCDate(timestamp);
    const toDate = addToDate(this.interval, fromDate, this.forwardLimit);
    return this.fetchDateRange("forward", fromDate, toDate);
  }

  async fetchBackward(timestamp: number): Promise<Candlestick[]> {
    const toDate = new UTCDate(timestamp);
    const fromDate = subtractFromDate(this.interval, toDate, this.backwardLimit);
    return this.fetchDateRange("backward", fromDate, toDate);
  }

  private async fetchDateRange(fetchType: FetchType, fromDate: UTCDate, toDate: UTCDate): Promise<Candlestick[]> {
    const fromTimestamp = fromDate.getTime();
    const toTimestamp = toDate.getTime();
    const candlestickBlocks = await this.store.load(fromTimestamp, toTimestamp);
    if (!candlestickBlocks || candlestickBlocks.length === 0) {
      let candlesticksRange: Candlestick[] = [];
      switch (fetchType) {
        case "around":
          candlesticksRange = await this.dataFetchAround(fromTimestamp, toTimestamp);
          break;
        case "forward":
          candlesticksRange = await this.dataFetchForward(fromTimestamp, toTimestamp);
          break;
        case "backward":
          candlesticksRange = await this.dataFetchBackward(fromTimestamp, toTimestamp);
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
      const missingHeadTimestamp = subtractFromTimestamp(this.interval, firstCandlestick.timestamp, 1);
      const missingHead = await this.dataFetchBackward(fromTimestamp, missingHeadTimestamp);
      return [...missingHead, ...candlestickBlocks[0]];
    }
    if (isMissingTail) {
      const missingTailTimestamp = addToTimestamp(this.interval, lastCandlestick.timestamp, 1);
      const missingTail = await this.dataFetchForward(missingTailTimestamp, toTimestamp);
      return [...candlestickBlocks[0], ...missingTail];
    }
    const firstBlockLastTimestamp = (firstCandlestickBlock.at(-1) as Candlestick).timestamp;
    const lastBlockFirstTimestamp = lastCandlestickBlock[0].timestamp;
    const missingRangeFromTimestamp = addToTimestamp(this.interval, firstBlockLastTimestamp, 1);
    const missingRangeToTimestamp = subtractFromTimestamp(this.interval, lastBlockFirstTimestamp, 1);
    let missingRange: Candlestick[] = [];
    switch (fetchType) {
      case "around":
        missingRange = await this.dataFetchAround(missingRangeFromTimestamp, missingRangeToTimestamp);
        break;
      case "forward":
        missingRange = await this.dataFetchForward(missingRangeFromTimestamp, missingRangeToTimestamp);
        break;
      case "backward":
        missingRange = await this.dataFetchBackward(missingRangeFromTimestamp, missingRangeToTimestamp);
        break;
    }
    return [...candlestickBlocks[0], ...missingRange, ...candlestickBlocks[1]];
  }

  private async dataFetchAround(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[]> {
    const middleDate = new UTCDate((fromTimestamp + toTimestamp) / 2);
    const candlesticks = await this.dataFetcher.fetchAround(middleDate.getTime());
    if (candlesticks && candlesticks.length > 0) {
      await this.store.save(candlesticks);
    }
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
  }

  private async dataFetchForward(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchForward(fromTimestamp);
    await this.store.save(candlesticks);
    return sliceCandlesticksToDateRange(candlesticks, fromTimestamp, toTimestamp);
  }

  private async dataFetchBackward(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[]> {
    const candlesticks = await this.dataFetcher.fetchBackward(toTimestamp);
    await this.store.save(candlesticks);
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

export interface Store {
  load(fromTimestamp: number, toTimestamp: number): Promise<Candlestick[][]>;
  save(candlesticks: Candlestick[]): Promise<void>;
}
