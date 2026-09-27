# Sarvam speech + Perplexity research

Sarvam handles audio input/output. Perplexity continues to produce source-linked answers. There is no separate research model or API credential per language.

Microphone → MediaRecorder → `/api/voice` → Sarvam transcription → editable question → `/api/chat` → Perplexity answer + original citations → `/api/voice` → Sarvam narration.

## Enable locally

1. Add your own `SARVAM_API_KEY` value to the ignored `.env.local` beside `PERPLEXITY_API_KEY`. Do not prefix it with `VITE_`, paste it into chat, or commit it.
2. Restart `npm run dev` (or the production Node server) and refresh the page.
3. Open Research Room → the information icon beside the composer. It should say **Cloud voice is connected**. This confirms server configuration, not that the credential has been accepted by Sarvam.
4. Allow microphone access. Tap the microphone, speak a short question, then tap it again. Review the transcription before sending. Use **Read aloud** or enable **Read replies**.

For Vercel/Netlify, set the same variable in server environment settings and redeploy. `/api/voice` adapters are included. HTTPS is required outside localhost; microphone permission is still necessary. Cloud speech does not bypass an embedded browser's media permissions. If the in-app browser cannot open the microphone, use Chrome or Edge with this same URL.

## API choices

- Speech input: `POST https://api.sarvam.ai/speech-to-text`; multipart `file`, `model=saaras:v3`, `mode=transcribe`, selected BCP-47 `language_code`. This preserves the spoken language rather than translating every query into English.
- Speech output: `POST https://api.sarvam.ai/text-to-speech`; `model=bulbul:v3`, `speaker=shubh`, selected `language_code`, WAV at 24 kHz. The client splits long narration into passages of about 2,000 characters (provider maximum 2,500). Citation markers and URLs are excluded from speech but remain visible.
- Native browser `getUserMedia`, `MediaRecorder` and `Audio` plus server `fetch` are enough; no extra speech library was installed.
- All eight research languages use the same two speech endpoints. Text answers keep original source URLs/titles. Installed device voices are not required in cloud mode.

## Bounds and failure handling

- Tap-to-record only; each clip stops after 25 seconds. A pending microphone permission request times out after 12 seconds; late streams are closed. The browser chooses supported WebM/Opus, MP4 or Ogg recording.
- Raw audio is held in memory, bounded to 1 MB, and sent through the backend only after finishing. Cancel discards it. The app does not persist raw recordings or log transcripts. Sarvam separately processes submitted recordings under its service policies.
- The server rejects off-origin requests, unsupported languages/formats, oversized payloads and arbitrary actions. Model, voice and provider URLs are controlled by the server. Upstream account details/keys are never returned to the client.
- Combined voice budget defaults to 120 upstream requests/hour/server process (`VOICE_HOURLY_LIMIT`), with 20 requests/minute/client. These are demo bounds, not distributed account-wide spending limits.
- Narration replay uses at most ten cached passages / 12 MB in browser memory. Stops cancel requests/playback and revoke active audio URLs. Leaving the room, hiding the tab, starting another question, changing language or a new conversation cancels activity. Already submitted provider calls may still be billable.
- Typed questions remain available if microphone access, cloud speech or browser fallback fails. No automatic paid retries.
- Research Room uses an editable transcript. **AI Guide → Voice conversation** submits recognised speech directly, narrates the answer, then automatically listens for follow-ups until paused/ended. Its optional captions and citations do not introduce a typing/chat requirement. **AI Avatar** remains a separate, unconnected Tavus preview.

## Voice conversation behavior

- Explicit **Start conversation** enables the ongoing voice loop. Microphone audio is never opened on page load. At each turn the browser detects sustained audio followed by about 1.5 seconds of quiet, then transcribes and submits the question. **Answer now** is a manual finishing option if room noise prevents detecting the pause.
- The microphone is released before transcription/research/playback and reopened about 650 ms after narration finishes. This is turn-based conversation, not simultaneous speech/streaming or automatic spoken barge-in. **Interrupt & speak** stops narration and opens a new recording turn.
- Initial silence for about ten seconds pauses the session without uploading an empty clip. Noise thresholds are a simple local audio-level heuristic and need calibration in the actual kiosk environment; no claim of robust speech/noise classification is made. Each recording still has the 25-second cap.
- Perplexity receives `responseStyle: voice`, which adds concise conversational instructions and a 550-token limit. Citation markers remain available in the source panel but are removed from audio. Voice/research cache entries are separate, and up to three prior question/answer pairs supply follow-up context.
- Common greetings, thanks and friendly check-ins are handled by the server before research, with short replies in the selected language. Native-script and common transliterated greetings such as `नमस्कार` and `Namaskar` are recognised as complete utterances. These replies use Sarvam narration but make no paid research request and need no citations. Courtesy turns do not displace the earlier research context. A greeting followed by a factual question stays on the research path; model instructions also distinguish social conversation from research for unmatched phrasing.
- `node scripts/check-greeting-live.mjs` checks the current local API's Marathi social replies without research calls. Adding `--speech` makes one paid Sarvam narration check. These scripted checks do not test physical microphone recognition.
- **Pause**, **End**, changing mode/language, leaving the page, going offline or hiding the tab stops current work. End and unmount clear conversational history and narration cache. A late response cannot resume playback or reopen the mic after cancellation. Provider calls already submitted may remain billable.
- API or audio errors pause the conversation instead of repeatedly retrying. Captions show the latest exchange only, and source references remain inspectable; opening sources pauses recording.
- `node scripts/check-guide-live.mjs` is an opt-in paid check of a concise answer, narration, and a contextual follow-up. The default automated tests use fake audio engines and provider responses to verify lifecycle/cancellation without charging.

## Cost and references

Checked 27 September 2026: official listed STT rate is ₹30/hour of audio, billed by the second; Bulbul v3 is ₹30/10,000 characters. A 15-second question plus a 500-character spoken answer is about ₹1.63 in speech usage at those rates, excluding Perplexity, hosting and applicable taxes. Actual bills depend on usage and provider pricing; long narrated answers cost more.

- [Sarvam transcription reference](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe)
- [Sarvam narration reference](https://docs.sarvam.ai/api-reference/text-to-speech/convert)
- [Sarvam pricing](https://docs.sarvam.ai/api/getting-started/pricing)
- [Browser speech limitations](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

Sarvam was activated and live-verified locally on 27 September 2026. An opt-in check generated a short Hindi question, transcribed that generated WAV, passed the transcript to research (five citations), and narrated a 500-character answer excerpt. All four requests succeeded. Run `node scripts/check-voice-live.mjs` only when you intentionally want another paid integration check.

This validates the provider connection and audio/text pipeline. It does not measure real visitor speech, microphone acoustics, accent accuracy or end-to-end kiosk latency. Unit tests additionally use injected microphone/audio engines and mocked provider responses.
