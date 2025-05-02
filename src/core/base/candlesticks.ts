import type { Exchange } from "@/core/base/exchange";
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
  fetch(interval: Interval, since: number, amount: number): Promise<Candlestick[]>;
}
