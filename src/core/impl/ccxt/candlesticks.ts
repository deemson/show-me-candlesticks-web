import type { Candlestick, Fetcher as IFetcher } from "@/core/base/candlesticks";
import { toShortString, type Interval, subtractFromTimestamp } from "@/core/base/interval";
import { Exchange } from "ccxt";

export class Fetcher implements IFetcher {
  private readonly limit: number;

  constructor(
    private readonly exchange: Exchange,
    limit: number,
  ) {
    this.limit = Math.floor(limit);
  }

  async fetchAround(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const previousTimestamp = subtractFromTimestamp(interval, timestamp, Math.floor((this.limit - 1) / 2));
    return this.fetchForward(symbol, interval, previousTimestamp);
  }

  async fetchForward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const ohlcv = await this.exchange.fetchOHLCV(symbol, toShortString(interval), timestamp, this.limit);
    return ohlcv.map(([timestamp, open, high, low, close, volume]) => {
      timestamp = timestamp === undefined ? 0 : timestamp;
      open = open === undefined ? 0 : open;
      high = high === undefined ? 0 : high;
      low = low === undefined ? 0 : low;
      close = close === undefined ? 0 : close;
      volume = volume === undefined ? 0 : volume;
      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      };
    });
  }

  async fetchBackward(symbol: string, interval: Interval, timestamp: number): Promise<Candlestick[]> {
    const previousTimestamp = subtractFromTimestamp(interval, timestamp, this.limit);
    return this.fetchForward(symbol, interval, previousTimestamp);
  }
}
