# Prototype sources and provenance

Prepared 27 September 2026.

- Timeline dates and summaries draw on Dr. Ambedkar Foundation, Columbia University, London School of Economics, the Supreme Court of India and Parliament of India. The exact URLs live in `src/archive.js` and remain visible in the app.
- Entries cover selected milestones across his life. The interface does not claim an exhaustive chronology.
- No affiliation with any cited institution is asserted. Citations identify the sources of historical information.
- A later portrait is used contextually for events without a dedicated photograph. Its caption explicitly says it is not a photograph of the event. The 1947 committee photograph is also contextual for the 1949 entry.
- The Columbia photograph is captioned 1913–1916. The source upload identifies it with those years, but it is not evidence for every detail of the event biography.

## Photo records

1. Portrait: https://commons.wikimedia.org/wiki/File:Dr._Bhimrao_Ambedkar.jpg (Commons marks public domain in India).
2. Student photograph: https://commons.wikimedia.org/wiki/File:Dr._Babasaheb_Ambedkar_in_Columbia_University.jpg (Commons CC0 dedication).
3. Drafting Committee: https://commons.wikimedia.org/wiki/File:Drafting_Committee_for_the_Constitution_of_India._Dr._B._R._Ambedkar_in_the_center.jpg (Commons CC0 dedication).

These are historical images. No image generation was used to create historical evidence. They are credited separately from event text sources.

## Decorative timeline miniatures

On 27 September 2026, one six-scene atlas was generated with the OpenAI Image API (`gpt-image-2`, high quality, 2048×1536) through the bundled imagegen CLI, as requested by the user. The prompt is saved in `output/imagegen/timeline-dioramas-prompt.txt`; the original and extracted-alpha atlases are beside it.

Six transparent PNGs in `public/images/timeline/` evoke early learning, Columbia, London, the Mahad struggle, constitutional drafting and enduring writings. They are artistic miniatures, not exact historical site reconstructions or documentary evidence. The UI says this explicitly. No generated people or handwritten documents are presented as archival records.

`ambedkar-cutout.png` is the retained earlier masked crop of the credited portrait; it is no longer used by the timeline. `scripts/prepare-timeline-assets.py` records that extraction and the miniature preparation steps.

## Illustrated timeline portrait

The timeline now uses `public/images/timeline/ambedkar-scholar.webp`, with a transparent PNG master alongside it. This is an AI-created seated scholar illustration of Dr. B. R. Ambedkar holding a book. It is artistic interpretation, not a historical photograph or evidence of a particular event. Both the exhibit caption and the credits panel make that distinction.

Generated on 27 September 2026 through the bundled imagegen CLI and OpenAI Image API (`gpt-image-2`, edit mode, high quality, 1024×1536). The credited archival portrait was supplied as an identity reference. The full prompt is `output/imagegen/ambedkar-scholar-prompt.txt`. The generated master and extracted-alpha version are in the same directory. A flat chroma background was removed locally; `scripts/prepare-scholar-portrait.py` retains the complete silhouette with transparent padding and produces the PNG/WebP assets. The landing page and historical event photographs remain unchanged.

## Published page preview

The displayed page is rendered from:

https://judicialacademy.nic.in/sites/default/files/1458100182_selected%20work%20of%20Dr%20B%20Rambedkar.pdf

Title visible in the document: *Selected Works of Dr BR Ambedkar*. Printed page **2221**, PDF page **2222**. The page discusses social and economic democracy in relation to parliamentary democracy. It is related reading alongside the timeline's November 1949 entry and is not labelled as the original 1949 speech or as handwriting.

The Parliament Digital Library listing separately supports the November 1949 speech summary. Its direct download was unavailable during this build, so no Parliament page image was fabricated or substituted under that title.

The archive summaries are paraphrases. The short original-text extract in the document viewer comes from the displayed published page.

## Verification scope

The source-page image was visually inspected against its printed page label. Two additional rendered pages from the source search are not used by the UI. The corpus needs further curator review and expansion before institutional use.

## Siddharth avatar concept video

The user supplied `gemini_generated_video_79bcc732.mp4` on 27 September 2026 for the AI Avatar preview. It is an AI-generated introduction of Siddharth, a fictional Abhilekh guide, not archival footage or a depiction of Dr. Ambedkar. The video describes the avatar as still in development.

`public/media/siddharth-introduction.mp4` preserves the supplied H.264/AAC audio and video streams, with MP4 metadata moved to the beginning for playback startup. Duration: 10.005 seconds; portrait dimensions: 720×1280. `siddharth-poster.jpg` is a frame from that clip. English captions in `siddharth-introduction.en.vtt` reproduce its spoken introduction, checked through transcription of the supplied audio; cue boundaries were set manually.

The UI labels it **Recorded preview** and **In development**, describes live avatar conversation as planned for the hackathon, and links to the working voice-only guide. No live avatar service is claimed or invoked. No media generation was performed for this integration.
