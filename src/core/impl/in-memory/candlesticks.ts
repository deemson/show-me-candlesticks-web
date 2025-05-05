import type {
  Candlestick,
  Fetcher as IFetcher,
  FetchAroundResult,
  FetchBackwardResult,
  FetchForwardResult,
} from "@/core/base/candlesticks";

export class CachingFetcher implements IFetcher {
  fetchAround(timestamp: number): Promise<FetchAroundResult> {
    throw new Error("Method not implemented.");
  }
  fetchForward(timestamp: number): Promise<FetchForwardResult> {
    throw new Error("Method not implemented.");
  }
  fetchBackward(timestamp: number): Promise<FetchBackwardResult> {
    throw new Error("Method not implemented.");
  }
}
