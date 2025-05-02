import { Set } from "immutable";
import type { Interval } from "@/core/base/interval";

export const allExchanges = ["binance", "kraken"] as const;
export type Exchange = (typeof allExchanges)[number];

const krakenMinuteMap: Partial<Record<Interval, number>> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "4h": 240,
  "1d": 1440,
  "1w": 10080,
  "15d": 21600,
};

const allowedCandlestickIntervalMap: Record<Exchange, Set<Interval>> = {
  binance: Set(["1s", "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"]),
  kraken: Set(Object.keys(krakenMinuteMap) as Interval[]),
};

export const allowedCandlestickIntervals = (exchange: Exchange): Set<Interval> => {
  return allowedCandlestickIntervalMap[exchange];
};
