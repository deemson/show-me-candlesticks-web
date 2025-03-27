import "fake-indexeddb/auto";
import { openDB } from "idb";
import { expect, test } from "vitest";

test("asd", async () => {
  const db = await openDB("some");
  const tx = db.transaction("asd", "readonly")
  const store = tx.objectStore("asd")
});
