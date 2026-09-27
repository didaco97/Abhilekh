# Netlify deployment

- Repository: `didaco97/Abhilekh`; branch: `main`; base directory: leave blank.
- Node: 24 LTS, pinned in `.nvmrc`.
- Build: `npm run build`; publish: `dist`; functions: `netlify/functions`.
- `/api/chat` and `/api/voice` run as serverless functions on the same site origin.
- Hash routes (`#timeline`, `#research`, `#guide`) need no SPA rewrite.

## Server environment

Set these in Netlify's environment settings with the Functions scope. Never use a `VITE_` prefix or commit credential values.

| Variable | Value |
| --- | --- |
| `PERPLEXITY_API_KEY` | Research provider credential |
| `SARVAM_API_KEY` | Speech provider credential |
| `RESEARCH_MODEL` | `sonar-pro` |
| `RESEARCH_HOURLY_LIMIT` | `60` (per function instance) |
| `VOICE_HOURLY_LIMIT` | `120` (per function instance) |

`APP_ORIGIN` is only needed for the standalone Node server behind a proxy; Netlify handlers use the incoming request URL. `.env.local` remains local and is excluded from Git and the static site.

## Runtime limits

- Research waits up to 45 seconds and speech up to 35 seconds, within the platform's 60-second synchronous execution limit.
- Narration is split into 600-character passages. Audio responses are capped below the 6 MB buffered response limit.
- Platform rate limits apply per IP/domain: 12 chat and 30 voice requests per minute. These are burst controls, not a global spending cap.
- In-memory caches and hourly counters are temporary and are not shared across function instances. Provider budgets remain separate from hosting limits.
- Timeline assets and the recorded avatar video are static. Live research and speech require internet. OCR, logins, device sync and live avatar rendering remain planned features.

## Verify a deploy

1. Open the HTTPS site; check the welcome dialog, timeline, research and guide.
2. `GET /api/voice` should report `cloud: true` without returning secrets.
3. Run the opt-in API smoke check (uses paid provider requests):

```powershell
$env:CHECK_BASE_URL = 'https://your-site.netlify.app'
node scripts/check-voice-live.mjs
```

4. Allow microphone access and check an actual voice conversation on the intended device.
5. Keep provider keys in server settings when publishing future deploys; preview deployments need their own environment context if enabled.

References: [Netlify function limits](https://docs.netlify.com/build/functions/configuration/) · [Rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).
