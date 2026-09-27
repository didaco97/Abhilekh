# Interface verification

Checked on 27 September 2026 against the local Vite app.

## Planned workspaces and evaluator README

- Added the Workspaces route and a shared ten-module overview on the landing page. The same records drive both views: OCR, researcher/institutional login, research dashboard, kiosk connection/settings, collections, translated stories, curator workspace and knowledge connections.
- Browser checks confirmed identical module lists on both pages, Research/Institution/Kiosk filter counts of 4/4/2, and all ten landing-page cards opening a three-step workflow with a clear planned-status notice. Preview dialogs contain no credential/file inputs and do not connect devices.
- Checked 1280×720 desktop, 760×820 tablet and 390×844 mobile layouts. Card grids adapt to three/two/one columns, header navigation remains separated on tablet, and page/dialog widths do not overflow. Viewport overrides were reset. Saved preview: `verification/landing-planned-workspaces.png`.
- README begins with Team ID 133270, PSID SIH26096 and honeyBadger, then includes a local SVG logo, idea, feature-status matrix, actual/proposed technical approach, Mermaid architecture, demo steps and setup links. All local README assets/links resolve; the logo parses as SVG. Detailed setup notes are preserved in `docs/DEVELOPMENT.md`.
- Production build passes; the existing 51-test suite was run. No new backend integration is claimed for the planned modules.

## SIH welcome popup

- Added a startup overview for SIH26096, team honeyBadger, Team ID 133270. It labels the live avatar as a recorded preview and institutional kiosk/server/display integration as planned.
- Browser checks confirmed entry dismissal, no repeat when navigating to Research Room, reopening through About this prototype, Escape dismissal with focus restored to the trigger, and reappearance on New visit.
- Checked desktop layout at 985×615 CSS pixels and mobile at 300×649. The dialog had no horizontal overflow, the entry button remained visible and keyboard focus stayed inside the native dialog. Research Room still matched the 300×649 viewport after the additional footer link. Temporary viewport overrides were reset.
- Production build and all 51 existing tests passed. Screenshot: `verification/welcome-popup.png`.

## Netlify deployment preparation

- All 53 tests and the production build passed after limiting cloud narration to 600-character segments and capping buffered audio responses below 6 MB.
- Added coverage for complete, ordered multilingual narration across segments and for oversized upstream audio responses.
- Pinned Node 24 for hosting; the local test/build run used Node 25.6.1.
- Added Netlify per-IP/domain rate limits; deployment and platform enforcement still require live verification.
- The opt-in speech/research smoke script accepts `CHECK_BASE_URL` and sends the deployed site origin.

## Earlier interface checks

- Production build: passes.
- Fifty-one retrieval, citation-integrity, language validation/cache, browser/cloud speech lifecycle, voice-conversation, greeting routing, media byte-range and API safety tests: pass.
- Browser flows checked: timeline chapters, event panels, event-to-research context, source references, original-page preview, saved records, future-feature notices and disconnected guide preview.
- Keyboard checks: event activation, save, visit reset, modal Escape dismissal and focus return.
- Accessibility controls: larger text and reduced motion update the interface.
- Narrow-screen checks: home, timeline, research and guide; fixed heading/header overflow. Research and guide also fit a 300 CSS-pixel viewport.
- Development hot reload: moved the React root into a separate entry module to avoid repeated-root warnings during edits.
- 3D timeline: seven homepage milestones and fourteen full-exhibit milestones render with all scene images loaded. Chapter filters, next/previous navigation, keyboard arrows, guided playback and event panels were checked in the browser.
- Timeline layout: checked at 1600, 507 and 390 CSS pixels; the scene rail scrolls without causing horizontal page overflow. Generated miniatures are labelled as illustrations.
- Timeline media: transparent PNG masters are retained; the interface uses optimized WebP copies. The timeline portrait was subsequently replaced with a complete seated scholar illustration, with corresponding provenance and credits updates.
- Notes download: the in-app browser did not report a completed file download. A copyable Markdown text fallback is available in the notes panel; verify native downloads again in the deployment browser.

- Live backend check: Sonar Pro returned an answer about the Mahad Satyagraha with Supreme Court and government document references.
- Live browser check: generated answer rendering, numbered source panels, a follow-up asking for original published material, and saving its references all worked.
- Fixed Research Room: checked a live answer and follow-up in the viewport-sized chat. At a measured 1366×720 CSS-pixel viewport, page height stayed 720 px, chat height stayed 492 px and the composer top stayed 577.7 px before and after the answer. Only the conversation content grew.
- Separate source panel: inline citations highlight and focus the corresponding reference without scrolling the page; selecting an earlier answer changes the reference set correctly. Opening a source and returning to the panel worked.
- Narrow Research Room: tested at a measured 300×601 CSS-pixel viewport. The document remained 601 px high, the composer stayed in view, and a fresh answer ended within 1 px of the conversation's scroll bottom. Chat/Sources switching and new-conversation reset were checked. Physical phone keyboard behavior has not been device-tested.
- Fixed AI Guide: verified that document height matched the viewport at measured desktop 1108×692 and phone 300×649 CSS pixels. Preview and search buttons stayed visible; the information area scrolls independently when needed. Phone Guide preview/How it works switches, the disconnected-service notice and navigation to Research Room were checked.
- Frontend build scan: no provider key, credential variable or provider API endpoint found in generated browser code.
- Production Node smoke test: home page returned 200, invalid research input returned 400, and `.env.local` returned 404. The Vite dev server returned 403 for the same credential path. The production check made no paid request.

## Voice and multilingual research

- One live English question with Hindi selected returned a Hindi answer and four original institutional source references. Source titles/URLs remained original.
- Hindi Read aloud entered the reading state; Stop cleared it. Switching the next-answer selector to Marathi did not change the existing Hindi answer or its narration language. Leaving for AI Guide cleared playback state.
- This device exposes an English and Hindi reading voice but no Marathi reading voice. The Marathi selection showed the limitation and disabled automatic reading instead of selecting an unrelated voice.
- With the added language and voice controls, measured desktop document dimensions stayed 1108×692 CSS pixels; composer bottom stayed 569.6 px and conversation height 250 px before and after the long answer (only its scroll height increased).
- At 300×649 CSS pixels, document dimensions matched the viewport without horizontal overflow; the composer bottom was 518.7 px. Chat/Sources switching preserved the Hindi response and its references.
- Unit tests cover editable dictation, permission denial, discarded late transcripts, original-answer narration language, missing voices, multi-chunk playback and cancellation when dictation starts or the session is disposed.
- No physical microphone recording or audible pronunciation/translation-quality assessment was performed. Recognition availability, regional language accuracy, speaker output, permission prompts and phone keyboard behavior still need checks on the actual kiosk/phone. Browser speech APIs can be exposed even when their network speech service is unavailable.
- Production build and all 19 tests passed after final changes. Generated browser JS contains no provider key, credential variable or provider endpoint. Microphone policy is restricted to self; camera remains disabled.

## Browser dictation diagnosis and Sarvam integration

- Reproduced the user's input failure in the in-app browser: the recognizer returned its network-error message, "Speech input could not connect." The local research/voice backend was reachable. This identifies a browser-recognition connection failure, not a missing React package; microphone permission and actual acoustic capture were not independently established.
- Added a 12-second startup watchdog for exposed recognition APIs that never start. Tests verify that this ends with an honest error rather than suggesting an empty transcript is ready to send.
- Added one same-origin `/api/voice` adapter for Sarvam STT/TTS, with Vite/Node, Vercel and Netlify handlers. GET returned `cloud: false` locally: no Sarvam key was configured during verification. Live cloud speech remains unverified until the credential is supplied.
- Mock-provider tests validate Saaras v3 multipart transcription, selected native-script locale, Bulbul v3 narration, citation stripping, rejected malformed/off-origin/oversized requests, empty transcripts, missing audio and usage limits without exposing upstream credentials/account details.
- Fake-media tests validate release of the microphone, cancelled permission requests, discarded late transcripts, typed fallback after permission denial, audio playback cancellation and memory-cached narration replay. These do not establish live recognition accuracy or latency.
- Production build and all 31 tests pass. Generated client JS contains no Sarvam/Perplexity key names, secret patterns, authentication header or provider endpoint. Native recording and playback require no new npm library.

## Sarvam activation and live check

- Subsequently configured the server-only Sarvam credential; `/api/voice` now returns `cloud: true`, and the interface reports cloud voice connected. The credential remains in ignored local environment configuration.
- Live Hindi test succeeded: generated question WAV (139,308 bytes) → transcription "डॉक्टर अंबेडकर ने कोलंबिया विश्वविद्यालय में क्या पढ़ा था?" → Perplexity Hindi research with five references → 500-character answer excerpt narrated as a WAV (1,349,036 bytes).
- The opt-in script `scripts/check-voice-live.mjs` exercises actual services through the local API; it prints only step results, the public test transcript and reference/audio byte counts. It does not write audio or credentials. It is separate from `npm test` because it incurs provider usage.
- This is a generated-audio round trip, not a claim that a physical kiosk microphone or visitor pronunciation has been validated.
- The in-app browser's native recording path also reached **Listening** after requesting microphone access. The test recording was cancelled and discarded without transcription upload; the controls returned to idle. Real spoken-query accuracy and loudspeaker quality still need visitor/device testing.

## AI Guide voice conversation

- Added separate Voice conversation and AI Avatar modes. Voice uses the existing server adapters; Avatar remains a disconnected Tavus preview.
- Production build and all 43 tests pass. Tests cover automatic question submission, contextual follow-ups, pause/interrupt/end, late-response cancellation, speech boundaries, idle silence, narration callbacks and separate spoken-answer caching.
- Live voice-style research check returned an English answer with 130 words and five references; its Sarvam narration succeeded. A contextual follow-up returned 109 words and eight references. These are observations from one check, not latency or accuracy guarantees.
- The opt-in paid check is `scripts/check-guide-live.mjs`. It uses synthetic test questions through localhost and writes no credentials or audio files.
- In-browser Start reached “I’m listening” and MICROPHONE ON. Pause and switching directly from active recording to Avatar preview were exercised; returning to Voice showed the idle screen with MICROPHONE OFF. Test recordings were cancelled without transcription upload.
- English/Marathi language selection, optional captions and source panels were checked. Changing the language resets the conversation. Opening source details pauses an active session without starting an idle one.
- At measured desktop 1108×692 and mobile 300×649 CSS pixels, the document matched the viewport with no horizontal overflow. The idle presence area also fit without internal scrolling (202/202 px desktop; 181/181 px mobile). Controls remained visible with the optional mobile panels open.
- Saved UI proof: `verification/voice-guide.png`. Temporary browser viewport overrides were reset and the guide was left idle with the microphone off.
- The conversation is turn-based: pause after speaking, hear the response, then speak the follow-up. Use the Interrupt & speak button to stop narration. It is not full-duplex spoken interruption. Physical visitor speech, room-noise calibration, pronunciation and loudspeaker feedback have not been acoustically verified; the boundary detector is a local volume heuristic.

## Greeting handling correction

- Fixed the guide treating Marathi `नमस्कार` as a historical research request. Complete greetings, thanks and check-ins now receive a short server-side social reply in the selected language; they bypass paid research and are marked as conversation rather than unsupported evidence.
- Live localhost API checks passed for `नमस्कार`, `Namaskar`, `नमस्कार, तुम्ही कसे आहात?` and `धन्यवाद`. The first two returned `नमस्कार! तुमचं स्वागत आहे. तुम्हाला कशाबद्दल बोलायला आवडेल?` with no citations. One live Marathi Sarvam narration request returned a WAV successfully. No physical microphone recording was used for this check.
- Regression tests cover all eight selected reply languages, punctuation, native-script/transliterated greetings, full-message matching, greeting-plus-question and greeting-definition requests, API validation, narration/follow-up continuation, and preserving earlier research context across courtesy turns.
- Production build and all 49 automated tests passed after the correction. The opt-in live check is `scripts/check-greeting-live.mjs --speech`; omitting `--speech` skips paid narration.

## Siddharth recorded avatar preview

- Added the supplied 720×1280, 10.005-second H.264/AAC video to AI Avatar. FFmpeg moved MP4 metadata for fast startup without re-encoding the supplied audio/video. Extracted a poster and added English caption cues from a transcription check of the supplied audio.
- Revised the presentation after user feedback: the 9:16 portrait stands directly on the page, with no wide letterbox frame, native toolbar or progress bar. Small overlaid controls provide playback/replay, sound and optional captions. Development context remains visible beside it, or below it on phones.
- In-browser silent autoplay on tab entry, replay with sound, pause, mute and caption show/hide were verified. The custom sound control starts narration from the beginning. The working voice CTA opened an idle voice session with microphone off. Phone Preview/About Siddharth tabs and pausing when the video is hidden were checked.
- At measured desktop 1108×692 CSS pixels, the portrait was 237.74×422.66 px (9:16), both document dimensions matched the viewport, and the details fit without internal scrolling (339/339 px). At mobile 300×649, the portrait was 163.79×291.19 px and the document stayed within the viewport. No source-video cropping was introduced.
- Production build and all 51 tests passed. A temporary production Node server passed MP4 MIME/length, partial-byte delivery (206), invalid-range rejection (416), and VTT caption delivery checks; that test server was stopped afterward.
- Final visual proof is `verification/siddharth-avatar-preview.png`. Temporary viewport overrides were reset; the preview was left paused and muted. Reduced-motion settings disable autoplay; native microphone/camera access and paid avatar sessions are never requested by this preview.

This is a kiosk prototype with live web research, connected cloud speech and a small curated exhibit. Tavus, public hosting, institutional semantic indexing and hardware integration remain unverified or unconnected. Provider-filtered references still need scholarly review; a citation is not automatic proof of a claim.
