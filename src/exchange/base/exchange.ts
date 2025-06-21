import type { Interval } from "@/core/base/interval";
import type { Fetcher as CandlesticksFetcher } from "@/core/base/candlesticks";

export interface Exchange {
  readonly name: string;
  supportedSymbols(): Promise<string[]>;
  supportedIntervals(): Promise<Interval[]>;
  candlesticks(): CandlesticksFetcher;
}
