import { test, expect } from "vitest";
import { Fetcher } from "@/core/impl/synthetic/candlesticks";
import type { Candlestick } from "@/core/base/candlesticks";
import * as interval from "@/core/base/interval";

test("Fetcher", async () => {
  const fetcher = new Fetcher(6, { amount: 1, unit: "days" });
  const date = interval.addToEpoch({ amount: 1, unit: "days" }, 15);

  const dumpCandlestick = (candlestick: Candlestick | null): string => {
    if (candlestick === null) {
      return "";
    }
    return [
      new Date(candlestick.timestamp).getUTCDate(),
      `O=${candlestick.open}`,
      `C=${candlestick.close}`,
      `L=${candlestick.low}`,
      `H=${candlestick.high}`,
      `V=${candlestick.volume}`,
    ].join(":");
  };

  const fetchAroundResult = await fetcher.fetchAround(date.getTime());
  expect(fetchAroundResult.beforeTimestamp.map(dumpCandlestick)).toEqual([
    "14:O=40:C=30:L=25:H=50:V=120",
    "15:O=30:C=40:L=35:H=45:V=100",
  ]);
  expect(dumpCandlestick(fetchAroundResult.atTimestamp)).toEqual("16:O=40:C=35:L=30:H=50:V=80");
  expect(fetchAroundResult.afterTimestamp.map(dumpCandlestick)).toEqual([
    "17:O=35:C=50:L=30:H=55:V=120",
    "18:O=50:C=20:L=10:H=60:V=100",
    "19:O=20:C=40:L=15:H=45:V=80",
  ]);

  const fetchForwardResult = await fetcher.fetchForward(date.getTime());
  expect(dumpCandlestick(fetchForwardResult.atTimestamp)).toEqual("16:O=40:C=35:L=30:H=50:V=80");
  expect(fetchForwardResult.afterTimestamp.map(dumpCandlestick)).toEqual([
    "17:O=35:C=50:L=30:H=55:V=120",
    "18:O=50:C=20:L=10:H=60:V=100",
    "19:O=20:C=40:L=15:H=45:V=80",
    "20:O=40:C=30:L=25:H=50:V=120",
    "21:O=30:C=40:L=35:H=45:V=100",
  ]);

  const fetchBackwardResult = await fetcher.fetchBackward(date.getTime());
  expect(fetchBackwardResult.beforeTimestamp.map(dumpCandlestick)).toEqual([
    "11:O=35:C=50:L=30:H=55:V=120",
    "12:O=50:C=20:L=10:H=60:V=100",
    "13:O=20:C=40:L=15:H=45:V=80",
    "14:O=40:C=30:L=25:H=50:V=120",
    "15:O=30:C=40:L=35:H=45:V=100",
  ]);
  expect(dumpCandlestick(fetchBackwardResult.atTimestamp)).toEqual("16:O=40:C=35:L=30:H=50:V=80");
});
