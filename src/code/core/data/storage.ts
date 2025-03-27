import type { Candlestick } from "@/code/core/data/candlestick.ts";
import type { Interval } from "@/code/core/data/interval.ts";
import type { Exchange } from '@/code/core/data/exchange.ts'

export interface Key {
  exchange: Exchange
  symbol: [string, string];
  interval: Interval;
}

export interface CandlestickReader {
  get(key: Key, from: Date, to: Date): Promise<Candlestick[]>;
}

export interface CandlestickWriter {
  put(key: Key, candlesticks: Candlestick[]): Promise<void>;
}
