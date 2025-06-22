import * as ccxt from "ccxt";
import { Fetcher as CcxtCandlesticksFetcher } from "@/core/impl/ccxt/candlesticks";
import { Fetcher as CachingCandlesticksFetcher } from "@/core/impl/cache/candlesticks/fetcher";
import { BlockIO as BlockCacheIO, FixedBlockSizeIndexer } from "@/core/impl/cache/candlesticks/block-io";
import { BlockCacheStoreProvider as IDBBlockCacheStoreProvider } from "@/core/impl/idb/candlesticks";
import {
  Fetcher as LoggingFetcher,
  CacheIO as LoggingCacheIO,
  BlockCacheStore as LoggingBlockCacheStore,
} from "@/core/impl/logging/candlesticks";

const ccxtBinanceExchange = new ccxt.binance();
const idbBlockCacheStoreProvider = await IDBBlockCacheStoreProvider.initialize("ShowMeCandlesticksDB");

const dataFetcher = new CcxtCandlesticksFetcher(ccxtBinanceExchange, 1000);
const loggingDataFetcher = new LoggingFetcher("CcxtBinance", dataFetcher);

const cacheIndexer = new FixedBlockSizeIndexer(100);
const cacheStore = idbBlockCacheStoreProvider.get("binance");
const loggingCacheStore = new LoggingBlockCacheStore("CacheStore", cacheStore);
const cacheIO = new BlockCacheIO(cacheIndexer, loggingCacheStore);
const loggingCacheIO = new LoggingCacheIO("CacheIO", cacheIO);
const cachingFetcher = new CachingCandlesticksFetcher(loggingDataFetcher, loggingCacheIO, 201);

export const fetcher = new LoggingFetcher("Cache", cachingFetcher);
