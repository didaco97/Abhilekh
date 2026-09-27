import test from "node:test";
import assert from "node:assert/strict";
import { parseByteRange } from "../server/byte-range.js";

test("media byte ranges support bounded, open-ended and suffix requests", () => {
  assert.deepEqual(parseByteRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseByteRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange("bytes=90-200", 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange("bytes=-200", 100), { start: 0, end: 99 });
});
test("invalid and unsatisfiable media ranges are rejected", () => {
  for (const header of ["bytes=-", "bytes=-0", "bytes=100-", "bytes=20-10", "bytes=0-1,4-5", "items=0-1", "bytes=9007199254740993-", "bytes=0-9007199254740993"])
    assert.equal(parseByteRange(header, 100), null, header);
  assert.equal(parseByteRange("bytes=0-", 0), null);
});
