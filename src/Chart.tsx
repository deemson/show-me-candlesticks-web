import { useEffect, useRef, type RefObject } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import data from "@/data/binance-2024-btc.json";

const candlestickData: CandlestickData[] = data.map((v) => {
  const [millis, open, high, low, close, _] = v;
  const time = (millis / 1000) as UTCTimestamp;
  return {
    time,
    open,
    high,
    low,
    close,
  };
});

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
    console.log(candlestickData);
    series.setData(candlestickData);
  }, []);

  return <div ref={containerRef} style={{ height: 300 }} />;
};
