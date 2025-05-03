import type { Interval } from "@/core/base/interval";

export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FetchForwardResult {
  atTimestamp: Candlestick | null;
  afterTimestamp: Candlestick[];
}

export interface FetchBackwardResult {
  beforeTimestamp: Candlestick[];
  atTimestamp: Candlestick | null;
}

export interface FetchCenteredResult {
  beforeTimestamp: Candlestick[];
  atTimestamp: Candlestick | null;
  afterTimestamp: Candlestick[];
}

export interface Fetcher {
  fetchCentered(interval: Interval, timestamp: number): Promise<FetchCenteredResult>;
  fetchForward(interval: Interval, timestamp: number): Promise<FetchForwardResult>;
  fetchBackward(interval: Interval, timestamp: number): Promise<FetchBackwardResult>;
}
