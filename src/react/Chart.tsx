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
import { fetcher } from "@/core/wired";

const candlestickToData = (candlestick: Candlestick): CandlestickData => {
  const time = (candlestick.timestamp / 1000) as UTCTimestamp;
  const { open, high, low, close } = candlestick;
  return { time, open, high, low, close };
};

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
      const candlesticks = await fetcher.fetchAround(
        "BTC/USDC",
        { unit: "days", amount: 1 },
        new Date(2024, 0, 1).getTime(),
      );
      series.setData(candlesticks.map(candlestickToData));
    })();
  }, []);

  return <div ref={containerRef} style={{ height: 500 }} />;
};
