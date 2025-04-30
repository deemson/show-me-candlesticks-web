import { describe, expect, test } from "vitest";
import { Reader } from "./candlesticks.ts";
import { binance } from "ccxt"

describe("Reader", async () => {
  const exchange = new binance();
  const reader = new Reader(exchange, {

  });

  test("around", async () => {
  });
});
