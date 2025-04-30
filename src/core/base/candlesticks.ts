import type { Interval } from "@/core/base/interval";

export interface Candlestick {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

