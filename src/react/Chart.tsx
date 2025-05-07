import { useEffect, useRef, type RefObject } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candlestick } from "@/core/base/candlesticks";
import { Fetcher as SyntheticCandlestickFetcher } from "@/core/impl/synthetic/candlesticks";
import { Fetcher as LoggingFetcher } from "@/core/impl/pino/candlesticks";

const candlestickToData = (candlestick: Candlestick): CandlestickData => {
  const time = (candlestick.timestamp / 1000) as UTCTimestamp;
  const { open, high, low, close } = candlestick;
  return { time, open, high, low, close };
};

const dataFetcher = new LoggingFetcher("synthetic", new SyntheticCandlestickFetcher(101, { amount: 1, unit: "days" }));

export const Chart = () => {
  const containerRef: RefObject<HTMLDivElement | null> = useRef(null);
  let chart: IChartApi;
  let series: ISeriesApi<"Candlestick">;

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }
    chart = createChart(containerRef.current);
    series = chart.addSeries(CandlestickSeries);

    (async () => {
      const candlesticks = await dataFetcher.fetchBackward(new Date().getTime());
      series.setData(candlesticks.map(candlestickToData));
    })();
  }, []);

  return <div ref={containerRef} style={{ height: 500 }} />;
};
