import { events, sources } from "./archive.js";

const stopWords = new Set(
  "a an the of to in on for and or is was were did does do what why how who where when about tell me dr ambedkar his he their it with can you i from at this that more know explain".split(
    " ",
  ),
);
export function tokenize(text) {
  return (
    String(text)
      .toLocaleLowerCase()
      .normalize("NFKC")
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((w) => w.length > 1 && !stopWords.has(w)) || []
  );
}
export function searchArchive(query, contextId = null) {
  const terms = [...new Set(tokenize(query))];
  const context = events.find((e) => e.id === contextId);
  const ranked = events
    .map((event) => {
      const tags = tokenize(event.tags);
      const title = tokenize(event.title);
      const body = tokenize(event.summary);
      const score = terms.reduce(
        (n, t) =>
          n +
          (tags.includes(t) ? 4 : 0) +
          (title.includes(t) ? 3 : 0) +
          (body.includes(t) ? 1 : 0),
        0,
      );
      return {
        event,
        score: score + (event.id === contextId && score > 0 ? 2 : 0),
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  // A contextual follow-up must not turn an unrelated question into an answer.
  const contextOnly = context && terms.length === 0;
  const matches = (contextOnly ? [{ event: context, score: 1 }] : ranked)
    .slice(0, 3)
    .map((r) => r.event);
  return {
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    query,
    mode: "curated-retrieval",
    intro: matches.length
      ? "Here is what the exhibit records say. Open a source to inspect the evidence."
      : "I couldn’t find enough supporting material in this sample archive. Try a question about the timeline, education, Mahad or constitutional democracy.",
    matches: matches.map((event) => ({
      ...event,
      citations: event.sourceIds.map((id) => sources[id]),
    })),
  };
}
