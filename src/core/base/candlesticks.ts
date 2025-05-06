export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fetcher {
  fetchAround(timestamp: number): Promise<Candlestick[]>;
  fetchForward(timestamp: number): Promise<Candlestick[]>;
  fetchBackward(timestamp: number): Promise<Candlestick[]>;
}
