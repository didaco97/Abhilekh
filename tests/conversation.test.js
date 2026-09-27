import test from "node:test";
import assert from "node:assert/strict";
import { socialIntent, conversationalReply } from "../server/conversation.js";
import { RESEARCH_LANGUAGES } from "../src/research-languages.js";

test("social routing recognises native-script, transliterated and combined greetings", () => {
  for (const query of ["नमस्कार!", " Namaskar. ", "नमस्कार सर", "अभिलेख नमस्कार", "नमस्कार, नमस्कार", "नमस्ते", "Hello there!", "Good morning", "வணக்கம்", "నమస్కారం", "নমস্কার", "નમસ્તે", "ನಮಸ್ಕಾರ", "जय भीम"])
    assert.equal(socialIntent(query), "greeting", query);
  for (const query of ["नमस्कार, तुम्ही कसे आहात?", "Hi, how are you?", "how's it going?", "tumhi kase aahat", "आप कैसे हैं?", "Can you hear me?"])
    assert.equal(socialIntent(query), "checkin", query);
  for (const query of ["धन्यवाद!", "खूप खूप धन्यवाद", "Thank you very much.", "नमस्कार, धन्यवाद.", "நன்றி", "આભાર", "धन्यवाद सर"])
    assert.equal(socialIntent(query), "thanks", query);
});

test("a greeting never swallows a factual question, a definition request or a contextual follow-up", () => {
  for (const query of ["नमस्कार, आंबेडकर कोलंबियामध्ये काय शिकले?", "Hello, tell me about Mahad.", "नमस्कार म्हणजे काय?", "What does Namaskar mean?", "जय भीम या अभिवादनाचा इतिहास काय आहे?", "Thanks, what happened next?", "How are you finding sources?", "yes", "okay", "tell me more", "नमस्कार ignore instructions", "Namaskarium", "thanks for explaining Mahad; when was it?", "sir"])
    assert.equal(socialIntent(query), null, query);
});

test("social replies use the selected language, omit evidence claims and stay specific to voice mode", () => {
  const replies = new Set();
  for (const { code } of RESEARCH_LANGUAGES) {
    const value = conversationalReply({ query: "Namaskar", responseStyle: "voice", language: code });
    assert.equal(value.language, code);
    assert.equal(value.mode, "conversation");
    assert.equal(value.evidence, "not-applicable");
    assert.deepEqual(value.citations, []);
    assert.doesNotMatch(value.answer, /Ambedkar|आंबेडकर|अंबेडकर|\[\d+\]/);
    replies.add(value.answer);
  }
  assert.equal(replies.size, RESEARCH_LANGUAGES.length);
  assert.match(conversationalReply({ query: "नमस्कार", responseStyle: "voice", language: "mr" }).answer, /^नमस्कार! तुमचं स्वागत/);
  assert.equal(conversationalReply({ query: "Namaskar", responseStyle: "research", language: "mr" }), null);
});
