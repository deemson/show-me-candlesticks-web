import type { DBSchema as IDBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { Candlestick } from "@/core/base/candlesticks";
import type { Interval } from "@/core/base/interval";
import { toShortString } from "@/core/base/interval";
import type { Store as IBlockCacheStore, BlockMap } from "@/core/impl/cache/candlesticks/block-io";

interface Block {
  exchange: string;
  symbol: string;
  interval: string;
  number: number;
  data: Candlestick[];
}

const storeName = "candlestickBlocks";

interface DBSchema extends IDBSchema {
  [storeName]: {
    value: Block;
    // exchange, symbol, interval, number
    key: [string, string, string, number];
  };
}

export class BlockCacheStoreProvider {
  static readonly version: number = 1;

  private constructor(private readonly db: IDBPDatabase<DBSchema>) {}

  static async initialize(dbName: string): Promise<BlockCacheStoreProvider> {
    const db = await openDB<DBSchema>(dbName, BlockCacheStoreProvider.version, {
      upgrade(db, version) {
        if (version < 1) {
          db.createObjectStore(storeName, {
            keyPath: ["exchange", "symbol", "interval", "number"],
          });
        }
      },
    });
    return new BlockCacheStoreProvider(db);
  }

  get(exchange: string): BlockCacheStore {
    return new BlockCacheStore(exchange, this.db);
  }
}

export class BlockCacheStore implements IBlockCacheStore {
  constructor(
    private readonly exchange: string,
    private readonly db: IDBPDatabase<DBSchema>,
  ) {}

  async load(symbol: string, interval: Interval, fromBlockNumber: number, toBlockNumber: number): Promise<BlockMap> {
    const lower = [this.exchange, symbol, toShortString(interval), fromBlockNumber];
    const upper = [this.exchange, symbol, toShortString(interval), toBlockNumber];
    const blocks = await this.db.getAll(storeName, IDBKeyRange.bound(lower, upper));
    const blockMap: BlockMap = new Map();
    for (const block of blocks) {
      blockMap.set(block.number, block.data);
    }
    return blockMap;
  }

  async save(symbol: string, interval: Interval, blockMap: BlockMap): Promise<void> {
    const tx = this.db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const promises = blockMap.entries().map(([blockNumber, candlesticks]) => {
      return store.put({
        exchange: this.exchange,
        symbol,
        interval: toShortString(interval),
        number: blockNumber,
        data: candlesticks,
      });
    });
    await Promise.all(promises);
    await tx.done;
  }
}
