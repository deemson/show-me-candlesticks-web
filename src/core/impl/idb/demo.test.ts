import { describe, test, expect } from "vitest";
import "fake-indexeddb/auto";
import { openDB } from "idb";

describe("idb and fake-indexeddb demonstrative tests", async () => {
  test("echange symbols are ok in store names", async () => {
    const storeName = "BTC/USDT-whatever"
    const db = await openDB("test-db", 1, {
      upgrade(db) {
        db.createObjectStore(storeName);
      },
    });
    const key = await db.put(storeName, { hello: "world" }, "test-key");
    expect(key).toEqual("test-key");
    expect(await db.get(storeName, "test-key")).toEqual({ hello: "world" });
  });
});
