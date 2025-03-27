export const values = ["binance", "kraken"] as const;
export type Exchange = (typeof values)[number];
