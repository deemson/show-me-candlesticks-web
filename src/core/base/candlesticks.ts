import type { Interval } from "@/core/base/interval";

export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fetcher {
  fetchAround(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]>;
  fetchForward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]>;
  fetchBackward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]>;
}
