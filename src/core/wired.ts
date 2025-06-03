import { Fetcher as SyntheticCandlesticksFetcher } from "@/core/impl/synthetic/candlesticks";
import { Fetcher as CachingCandlesticksFetcher } from "@/core/impl/cache/candlesticks/fetcher";
import { BlockIO as BlockCacheIO, FixedBlockSizeIndexer } from "@/core/impl/cache/candlesticks/block-io";
import { BlockCacheStore as InMemoryBlockCacheStore } from "@/core/impl/in-memory/candlesticks";
import type { BlockCache as InMemoryBlockCache } from "@/core/impl/in-memory/candlesticks";
import {
  Fetcher as LoggingFetcher,
  BlockCacheStore as LoggingBlockCacheStore,
  CacheIO as LoggingCacheIO,
} from "@/core/impl/pino/candlesticks";

const localWindow = window as unknown as { candlestickCache: InMemoryBlockCache };

const dataFetcher = new SyntheticCandlesticksFetcher(1000);
const loggingDataFetcher = new LoggingFetcher("SyntheticFetcher", dataFetcher);

const cacheIndexer = new FixedBlockSizeIndexer(100);
const cacheStore = new InMemoryBlockCacheStore();
localWindow.candlestickCache = cacheStore.blockCache;
const loggingCacheStore = new LoggingBlockCacheStore("CacheStore", cacheStore);
const cacheIO = new BlockCacheIO(cacheIndexer, loggingCacheStore);
const loggingCacheIO = new LoggingCacheIO("CacheIO", cacheIO);
const cachingFetcher = new CachingCandlesticksFetcher(loggingDataFetcher, loggingCacheIO, 201);

export const fetcher = new LoggingFetcher("Cache", cachingFetcher);
