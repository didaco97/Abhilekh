import test from "node:test";
import assert from "node:assert/strict";
import { searchArchive } from "../src/search.js";
import { events, sources } from "../src/archive.js";

test("Mahad question returns its event as the strongest match", () => {
  assert.equal(
    searchArchive("What was the Mahad Satyagraha?").matches[0].id,
    "mahad",
  );
});
test("a question outside the corpus is not answered using event context", () => {
  assert.deepEqual(
    searchArchive("Calculate quantum entanglement probabilities", "mahad")
      .matches,
    [],
  );
});
test("a context-only follow-up returns the selected event", () => {
  assert.equal(
    searchArchive("Tell me more", "drafting").matches[0].id,
    "drafting",
  );
});
test("every timeline record resolves to institutional evidence", () => {
  for (const event of events) {
    assert.ok(event.sourceIds.length > 0, event.id);
    for (const id of event.sourceIds)
      assert.ok(sources[id]?.url.startsWith("https://"), id);
  }
});
test("retrieval does not mislabel curated exhibit prose as generated AI", () => {
  const result = searchArchive("equality and social democracy");
  assert.equal(result.mode, "curated-retrieval");
  assert.equal(result.matches[0].id, "democracy");
  assert.ok(result.matches[0].citations.length > 0);
});
