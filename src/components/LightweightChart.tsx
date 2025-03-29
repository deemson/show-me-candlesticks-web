import { useEffect, useRef, type RefObject } from "react";
import { createChart, type IChartApi, type ISeriesApi, CandlestickSeries } from "lightweight-charts";

interface Props {
  data: any[]
  width: number
  height: number
}

export const LightweightChart = (props: Props = {data: [], width: 600, height: 300}) => {
  const chartContainerRef: RefObject<HTMLDivElement | null> = useRef(null);
  const chartRef: RefObject<IChartApi | null> = useRef(null);
  const seriesRef: RefObject<ISeriesApi<"Candlestick"> | null> = useRef(null);

  useEffect(() => {
    // Create chart
    if (chartContainerRef.current !== null) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: props.width,
        height: props.height,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#333",
        },
        grid: {
          vertLines: { color: "#eee" },
          horzLines: { color: "#eee" },
        },
      });
    }

    // Add series
    if (chartRef.current !== null) {
      seriesRef.current = chartRef.current.addSeries(CandlestickSeries);
    }
    if (seriesRef.current !== null) {
      seriesRef.current.setData(props.data);
    }

    // Resize handling (optional)
    const handleResize = () => {
      if (chartContainerRef.current !== null && chartRef.current !== null) {
        // chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current !== null) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Update data if it changes
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(props.data);
    }
  }, [props.data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height: props.height }} />;
};
