import type { ReadArgs } from "@/core/base/candlesticks";
import { Exchange } from "ccxt";

export interface Strategy {
  initializeExchange(): Exchange;
}
