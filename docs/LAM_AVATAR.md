# LAM + Audio2Expression integration

## What is implemented

- An experimental **Interactive avatar** panel alongside the original recorded introduction.
- Existing pipeline: microphone → Sarvam transcription → cited research → Sarvam narration.
- Added: narration WAV → LAM-derived Audio2Expression ONNX worker → 52 facial coefficients at 30 FPS → official LAM WebGL renderer.
- Audio is buffered while its motion is prepared. Motion follows the actual audio playback clock, including pauses and segment changes.
- Stop, route changes and interruption cancel pending preparation and reset the mouth. **Hear a sample** uses the same speech/animation path without opening the microphone.
- Renderer is loaded only for the interactive avatar; ordinary pages do not download its JavaScript.
- No synthetic amplitude-only mouth animation or prerecorded video is presented as live LAM inference.

## Custom avatar

Siddharth's custom 3D model is included at `public/avatars/siddharth.zip`. The user supplied `chatting_avatar_20260928033216.zip` after exporting the portrait through ModelScope. The validated ZIP is approximately 4.10 MB and contains the head geometry, splats, animation and vertex order. Local configuration now selects Siddharth. The upstream reference model remains available for development checks, and the original recorded introduction is preserved.

## Run locally

Python 3.12 and ONNX Runtime 1.24.2 were used for the CPU worker. No CUDA installation is needed for this ONNX path.

```powershell
python -m venv .venv-avatar
.\.venv-avatar\Scripts\python -m pip install -r services/avatar/requirements.txt
npm run avatar:setup
```

Set these local variables in `.env.local`:

```dotenv
AVATAR_PYTHON=.venv-avatar/Scripts/python.exe
AVATAR_SERVICE_URL=http://127.0.0.1:8765
AVATAR_ASSET_URL=/avatars/siddharth.zip
AVATAR_NAME=Siddharth
```

Run `npm run avatar:worker` and `npm run dev` in separate terminals. Existing Perplexity/Sarvam keys remain server-side. The avatar worker receives no provider keys through the launcher.

## Regenerate or replace the custom avatar

The supplied Siddharth model is already included; these steps are only needed for a new export. Preserve an existing `siddharth.zip` before importing a replacement; the importer refuses to overwrite it.

1. Open the [official LAM exporter](https://www.modelscope.cn/studios/Damo_XR_Lab/LAM_Large_Avatar_Model) and sign in.
2. Upload the supplied Siddharth portrait (a face-focused crop is prepared locally in `tmp/lam/siddharth-reference.png`).
3. Choose one of the supplied driving-video examples and enable **Export ZIP file for Chatting Avatar**.
4. Generate and download the avatar ZIP; the rendered MP4 is not the reusable 3D asset.
5. Run `python scripts/import-avatar.py 'C:\path\to\avatar.zip'`, restart the app and inspect the face, glasses, mouth and head motion.

## Deployment

- Netlify still hosts the app, ZIP asset and `/api/avatar` proxy.
- **The Python model worker needs an additional running machine/service.** Netlify Functions do not run this persistent Python/ONNX process.
- On Netlify set `AVATAR_SERVICE_URL` to that worker's HTTPS endpoint, `AVATAR_SERVICE_TOKEN` to a long server-only token, and the avatar asset/name variables.
- Binding the worker beyond localhost requires a token of at least 24 characters. Use an HTTPS reverse proxy, restrict access and cap concurrent requests. The worker runs one inference request at a time and does not persist audio.
- A local `127.0.0.1` worker is unreachable from Netlify. Until a reachable worker and Siddharth asset are configured, the published UI accurately shows the integration as unavailable.
- This is CPU inference plus browser rendering, not a claim of entirely on-device or offline conversation; speech/research remain online.

## Measurements and checks

- Host: GTX 1650 4 GB / approximately 16 GB system RAM. The expression test used **CPU**, not the GPU.
- Synthetic 5-second input: 150 frames in **0.89 seconds** after warm-up.
- Short Sarvam-generated test: 182 frames for 6.06 seconds of audio in **1.27 seconds**, including the local proxy call.
- A fresh Marathi test: **198 frames / 6.57 seconds of audio in 0.59 seconds**, including the local proxy call. Transcribing that generated audio recovered the Marathi test sentence correctly. Run the opt-in `node scripts/check-avatar-live.mjs` against the configured app; set `CHECK_BASE_URL` as needed and `CHECK_TRANSCRIPTION=1` for the speech round trip. These checks use paid speech requests.
- Worker working set after testing: approximately **564 MB**. Model download: approximately **404 MB** including external weights; the 1.8 MB ONNX graph alone is insufficient.
- These are single-machine observations, not guaranteed throughput, end-to-end conversational latency or multilingual lip-sync accuracy.
- Siddharth's custom face and glasses render in the browser. Physical-device frame rate, detailed multilingual mouth-shape accuracy and public-worker deployment remain to be evaluated.

## Sources and licences

- [LAM](https://github.com/aigc3d/LAM): one-image 3D avatar reconstruction. Code and weights have separate licence files; check `LICENSE_WEIGHT` for the original weights.
- [LAM Audio2Expression](https://github.com/aigc3d/LAM_Audio2Expression): audio-to-ARKit model.
- [LAM WebRender](https://github.com/aigc3d/LAM_WebRender): official browser renderer and reference asset; package `gaussian-splat-renderer-for-lam@0.0.9-alpha.2`.
- [Wav2ARKit ONNX conversion](https://huggingface.co/myned-ai/wav2arkit_cpu): community CPU conversion of LAM A2E + Wav2Vec2, revision `48b7d27a147d4dfcce4c8225b11209ce4cd76e05`; download hashes are verified. This is a community conversion, not a new Alibaba release.
