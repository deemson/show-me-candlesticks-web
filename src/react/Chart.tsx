import { useEffect, useRef, type RefObject } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import data2023 from "@/data/binance-2023-btc.json";
import data2024 from "@/data/binance-2024-btc.json";
import { fromUnixTime } from "date-fns";

const data = data2023.slice(0, data2023.length - 1).concat(data2024);

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
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleTimeRangeChange((dateRange: any) => {
      const { from, to } = dateRange;
      const fromDate = fromUnixTime(from);
      const toDate = fromUnixTime(to);
      console.log(fromDate.toISOString(), toDate.toISOString());
    });
    timeScale.subscribeVisibleLogicalRangeChange((dateRange: any) => {
      const { from, to } = dateRange;
      // console.log(`${from}:${to}=${to - from}`);
    });
    series = chart.addSeries(CandlestickSeries);
    series.setData(candlestickData);
  }, []);

  return <div ref={containerRef} style={{ height: 500 }} />;
};
