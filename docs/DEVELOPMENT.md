# Development and operations

A React/Vite kiosk and Node research backend for SIH26096. The visual direction uses archival photographs, warm paper, deep ink blue and editorial typography. Live source-linked research is connected; the avatar is a recorded concept preview. LAM is being evaluated for a later live avatar integration.

## Run locally

Requires a current Node.js version compatible with the locked Vite release. Developed with Node 25.6.1.

The local server reads `PERPLEXITY_API_KEY` from the ignored `.env.local` file or server environment. `.env.example` contains the configuration names without a key. Never use a `VITE_` prefix for credentials.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Routes are `#home`, `#timeline`, `#research`, `#guide` and `#workspaces`.

```powershell
npm test
npm run build
npm run preview
```

## Working flows

- A welcome popup on page load and **New visit** introduces SIH26096, team **honeyBadger** (ID **133270**), the four demo features, development status and proposed kiosk/server/display integration. **About this prototype** in the footer reopens it. The dialog scrolls internally on smaller screens, keeps its entry button visible, supports Escape and pauses background exhibit/guide activity. Team registration fields live in `src/PrototypeWelcome.jsx`.
- Landing page and a 14-event timeline spanning 1891–1956, with chapter filters and an optional guided playback.
- The home preview and full timeline use a layered 3D exhibit: six generated miniature scenes on CSS perspective plinths, an illustrated seated scholar cutout, subtle pointer parallax, drag/swipe scrolling and previous/next navigation. The home preview shows seven milestones; the full view retains all fourteen. Illustration credits distinguish the generated artwork from the landing page's archival photograph.
- Touch or keyboard activation opens an event panel with contextual historical imagery, a summary and institutional citations.
- **Know more** carries the event into the research room and supplies its curated context to the backend.
- Live research through `POST /api/chat`, using Sonar Pro with medium search context and a bounded response. The frontend never calls the provider directly and does not receive its key.
- Numbered citations, source panels, institutional PDF links, follow-up conversation context, loading/cancel states and saved research answers.
- A viewport-sized Research Room with a fixed composer, independently scrolling conversation and source panels, citation highlighting and a reference selector for earlier answers. Phones switch between Chat and Sources in the same workspace.
- Search is restricted to configured institutional, university and constitutional archive domains. The server preserves citation numbers and rejects unsafe or off-list URLs. Citation presence is not proof that every statement is correct: the UI asks visitors to check originals and flags missing reference support.
- Local curated exhibit retrieval remains an explicitly labelled fallback if live research fails.
- A real page preview from *Selected Works of Dr BR Ambedkar*, printed page 2221 / PDF page 2222, with a link to the institutional PDF. It is related reading on democracy, not the 1949 speech facsimile.
- Visit notes, source references and Markdown export with copyable text if the browser blocks downloads. Data lives in memory only and clears on reload or **New visit**.
- Responsive layouts, native modal focus handling, Escape dismissal, larger-text controls and reduced-motion support.
- Language selection for research answers: English, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati and Kannada. One server endpoint/model receives an allowlisted language; citations retain original URLs and source titles. Cached answers are separated by language.
- Tap-to-dictate questions (review before sending), per-answer Read aloud / Stop, and optional Read replies. With `SARVAM_API_KEY` configured, native microphone recording feeds server-side Sarvam transcription and answers use Sarvam narration. Without the key, browser speech remains available where supported. Recording never starts automatically; leaving the room, hiding the tab or starting a new visit stops speech. See [speech setup](../VOICE_SETUP.md).
- The landing page and Workspaces share all ten planned modules: OCR scanning, researcher and institutional login, research dashboard, kiosk connection/settings, reviewed translations, collections, knowledge connections and curator tools. Workspaces filters by Research, Institution or Kiosk. Cards open a three-step workflow and an implementation-status notice; they collect no credentials, accept no uploads and change no device settings.
- AI Guide has two modes: **Voice conversation** (working) and **AI Avatar** (recorded preview). The voice mode starts only on request, detects a pause after speech, submits the recognised question automatically, narrates a concise source-linked answer and listens for follow-ups. It includes pause/end, tap-to-interrupt, optional latest-exchange captions and original references, and the same eight languages. No text entry or Send step is required in this mode.
- AI Avatar introduces **Siddharth** through the user-provided ten-second concept video, with a visible **In development** notice and planned hackathon features. The standalone 9:16 portrait has no surrounding player frame or native progress bar. It plays once muted with optional English captions; **Sound on** restarts from the beginning. Small overlaid controls provide pause, replay, sound and captions. Reduced motion disables automatic playback. A direct link opens the working voice mode. Selecting Avatar never starts a live avatar session, camera or microphone. Playback pauses when the tab is hidden, an overlay opens or the preview is left.

## What is pending

- Institutional corpus retrieval, ingestion and semantic indexing. The current live answers use published web sources; this is not the PPT's full E5/pgvector/RRF/RAG stack.
- Live avatar animation and audio synchronisation. LAM + Audio2Expression is under evaluation; no live rendering engine is integrated. Keep the avatar connected to the same answer and citation pipeline.
- Additional original pages, collection ingestion and source review. The prototype contains 14 milestone records and one displayed document page, not the previously proposed 150-page/3-AV pilot corpus.
- Reviewed multilingual exhibit/UI translations, real visitor speech/acoustic testing on the kiosk, semantic search, OCR, institutional management, device synchronisation and deployment benchmarks. The live Sarvam transcription/research/narration API chain has passed a Hindi smoke test.
- Public hosting. A local preview is not a public submission URL.

## Deployment

The frontend builds to `dist`, but live research also requires a server endpoint. For a Node host, run `npm run build` then `npm start`; set `PORT`, `HOST` and `APP_ORIGIN` as required by the host. The default binds to localhost. Hash routes need no history rewrites.

Vercel and Netlify adapters are included at `api/chat.js` and `netlify/functions/chat.mjs`. Set the project root to `abhilekh-prototype`, configure the credential in server environment settings, and verify function execution after deployment. Uploading only `dist` to a static host does not enable live research. Cloud deployment has not yet been performed.

## Research service controls

- Default model: `sonar-pro`; medium search context; maximum 1,100 output tokens; 45-second upstream timeout.
- Last three complete conversation pairs, bounded to 3,000 characters per message; current question limited to 1,200 characters.
- Identical requests are coalesced and cached in memory for six hours, up to 200 entries. Nothing is written to a query log.
- Ten requests per minute per client and sixty upstream requests per hour per server process by default. These are demo controls, not a distributed budget ceiling: serverless instances and restarts have separate counters. Set provider-level spending limits and deployment-level abuse controls before unrestricted public access.
- Stops and new conversations abort the browser request and prevent stale answers appearing. An already-submitted provider call may still finish and be charged; its successful result can populate the cache.
- No automatic retry or expensive deep-research escalation. Upstream failures are returned as generic UI messages, without raw provider/account data.
- No automatic image or manuscript generation. Online document references are labelled as web pages or published PDFs; the existing verified local facsimile is separately captioned.

Provider documentation: [Sonar API](https://docs.perplexity.ai/docs/sonar/quickstart), [request schema](https://docs.perplexity.ai/api-reference/sonar-post), [pricing](https://docs.perplexity.ai/docs/getting-started/pricing). Model/context selection is a prototype choice, not a claim of universally best quality.

Microphone policy allows this origin only; camera stays disabled. Dictation requires a secure context (HTTPS or localhost), browser recording support and explicit microphone permission. Configured cloud voice uses Sarvam; browser fallback may use the browser vendor’s online speech service and available device voices. Neither mode guarantees offline speech. This app does not persist recordings or log their transcripts; active-session narration has a bounded memory cache, cleared on new conversation/visit, session disposal or reload. See [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) and [device reading voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices).

The deployment approach remains one multilingual pipeline: selected locale → speech recognition → the same research backend → answer and original citations → matching-language speech synthesis. Sarvam is wired as the shared speech service, enabled when its server credential is configured. For a fixed institutional kiosk, validate its browser, microphone, speakers and speech quality. Answer-language selection does not imply expert-reviewed translations or a translated archive/UI.

Keep all provider secrets on the server. Never place secrets in `VITE_*` variables or browser storage. Do not reuse a credential that has been posted in a chat or committed to a repository.

## Sources and assets

`src/archive.js` records event sources, institutional links, image captions and credits. [SOURCE_NOTES.md](../SOURCE_NOTES.md) records provenance and interpretation boundaries. Fonts and exhibit assets are bundled locally. The app has no third-party runtime scripts, telemetry or external font requests.

`scripts/` contains reproducible image/document preparation helpers. Downloaded full PDFs remain in `research/`, outside the public web bundle. Only the selected page image is distributed with the front end.

Already-loaded local content and curated fallback records do not need cloud APIs. Live research requires an internet connection. There is no service worker or guaranteed offline restart support. External source URLs may be unavailable independently of the prototype.

## Suggested demo

1. Open **Life & timeline** and select **The nation-builder**.
2. Tap **1949**, open the event, save it, then choose **Know more**.
3. Open the related original-page preview and inspect its page reference.
4. Open **Visit notes** and export the reference.
5. Open **AI guide → Voice conversation**, choose a language and start. Ask a question, pause, and hear the response. Follow up, pause/end, or open optional captions and sources. **AI Avatar** shows the separate recorded preview.
6. Open a planned feature to show the SIH MVP notice.

Live research is connected. Live avatar, institutional indexing and public hosting remain next integration steps.

