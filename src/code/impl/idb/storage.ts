// import type { Candlestick } from "@/code/core/data/candlestick";
// import type {
//   CandlestickReader as ICandlestickReader,
//   CandlestickWriter as ICandlestickWriter,
//   Key,
// } from "@/code/core/data/storage.ts";
//
// export class CandlestickReader implements ICandlestickReader {
//   constructor(private readonly store: IDBObjectStore) {}
//
//   get(key: Key, from: Date, to: Date): Promise<Candlestick[]> {
//     this.store.add()
//   }
// }
//
// export class CandlestickWriter implements ICandlestickWriter {
//   put(key: Key, candlesticks: Candlestick[]): Promise<void> {
//     throw new Error("Method not implemented.");
//   }
// }
