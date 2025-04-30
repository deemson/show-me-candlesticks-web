import { describe, test, expect } from "vitest";
import "fake-indexeddb/auto";
import { openDB } from "idb";

describe("idb and fake-indexeddb demonstrative tests", async () => {
  test("some", async () => {
    const db = await openDB("test-db", 1, {
      upgrade(db) {
        db.createObjectStore("test-store");
      },
    });
    const key = await db.put("test-store", { hello: "world" }, "test-key");
    expect(key).toEqual("test-key");
    expect(await db.get("test-store", "test-key")).toEqual({ hello: "world" });
  });
});
