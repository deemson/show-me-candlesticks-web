import type { Candlestick, Reader as IReader, ReadArgs } from "@/core/base/candlesticks";
import { Exchange } from "ccxt";
import type { Interval } from "@/core/base/interval";

export interface ReaderSettings {
  supportedIntervals: Interval[];
  maximumResponseLength: number;
}

export class Reader implements IReader {

  constructor(private readonly exchange: Exchange, settings: ReaderSettings) {
  }

  async around(args: ReadArgs): Promise<Candlestick[]> {
    return [];
  }
  async before(args: ReadArgs): Promise<Candlestick[]> {
    return [];
  }
  async after(args: ReadArgs): Promise<Candlestick[]> {
    return [];
  }
}
