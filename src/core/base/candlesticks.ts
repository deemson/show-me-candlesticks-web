export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FetchForwardResult {
  atTimestamp: Candlestick | null;
  afterTimestamp: Candlestick[];
}

export interface FetchBackwardResult {
  beforeTimestamp: Candlestick[];
  atTimestamp: Candlestick | null;
}

export interface FetchAroundResult {
  beforeTimestamp: Candlestick[];
  atTimestamp: Candlestick | null;
  afterTimestamp: Candlestick[];
}

export interface Fetcher {
  fetchAround(timestamp: number): Promise<FetchAroundResult>;
  fetchForward(timestamp: number): Promise<FetchForwardResult>;
  fetchBackward(timestamp: number): Promise<FetchBackwardResult>;
}
