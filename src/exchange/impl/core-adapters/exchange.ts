import type { Fetcher } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import { toShortString } from "@/core/base/interval";
import type { Fetcher as SymbolsFetcher } from "@/core/base/symbols";
import type { Fetcher as CandlesticksFetcher } from "@/core/base/candlesticks";
import type { Exchange as IExchange } from "@/exchange/base/exchange";

export class Exchange implements IExchange {
  readonly name: string;

  private readonly candlesticksFetchersMap: Map<string, CandlesticksFetcher>;
  private readonly supportedIntervalsArray: Interval[];

  constructor(
    name: string,
    private readonly symbolsFetcher: SymbolsFetcher,
    candlesticksFetchers: [Interval, CandlesticksFetcher][],
  ) {
    this.name = name;
    this.candlesticksFetchersMap = new Map();
    const supportedIntervals: Interval[] = [];
    for (const [interval, candlesticksFetcher] of candlesticksFetchers) {
      const intervalString = toShortString(interval);
      this.candlesticksFetchersMap.set(intervalString, candlesticksFetcher);
      supportedIntervals.push(interval);
    }
    this.supportedIntervalsArray = supportedIntervals;
  }

  async supportedSymbols(): Promise<string[]> {
    return this.symbolsFetcher.fetch();
  }

  async supportedIntervals(): Promise<Interval[]> {
    return this.supportedIntervalsArray;
  }

  candlesticks(): CandlesticksFetcher {
    const intervalString = toShortString(interval);
    const fetcher = this.candlesticksFetchersMap.get(intervalString);
    if (fetcher === undefined) {
      throw new Error(`'${intervalString}' is an unsupported interval for '${this.name}' exchange`);
    }
    return fetcher;
  }
}
