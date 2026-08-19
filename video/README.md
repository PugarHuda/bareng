# The finale pitch video

A three minute pitch film, rendered by [Remotion](https://remotion.dev). Built for the UXmaxx
finale on 21 August 2026, where each team's pitch is played from a recording and only the Q&A that
follows is live.

Its own `node_modules`, deliberately. The Next app that judges will click through is deployed from
this same repo, and a dependency added for a video is not worth any risk to that build.

## Rebuild

```bash
cd video
npm install
node scripts/vo.mjs      # narration → public/vo/*.mp3 + src/timeline.json
node scripts/clip.mjs    # records the live app → public/clip/{core,tour}.mp4  (needs chrome + ffmpeg)
npm run render           # → out/bareng-pitch.mp4
npm run studio           # optional: preview and scrub in the browser
```

Add `--fresh` to either script to discard what it cached and start over.

## How it is put together

`scripts/vo.mjs` holds the spoken words, one line at a time, and synthesises each through edge-tts.
It measures the resulting audio and writes `src/timeline.json`, and **everything downstream is cut
to those measurements** — scene lengths, when each card appears, how long a caption holds, and how
long the recorder dwells on each part of the app. Rewrite a line and the picture re-cuts itself on
the next build. Nothing is timed by hand, so nothing drifts.

That file also enforces the three minute limit and prints the headroom left. It is currently 2:52.

It keeps a manifest of what each mp3 actually says, and re-synthesises any line whose wording
changed. Without that, editing a sentence leaves the old audio in place — the file for that id
already exists — and the caption then reads the new sentence while the voice speaks the old one.
Nothing errors, and it is only audible if you happen to be listening to that exact line.

`scripts/clip.mjs` drives the deployed app with Playwright and records it silently, one file per
recorded scene: `core` is the money path, `tour` is Arisan, Split, Receive, Earn and the capped
agent. Two things about it are not obvious and both took a wrong turn to find:

- **Playwright will not scale a capture up** to a larger `recordVideo` size. Ask for 1920x1080 from a
  1280x720 viewport and it pads instead, leaving the page in the top-left of a grey canvas. So the
  viewport is a real 1920x1080 and the page is zoomed 1.5x, which reproduces the layout that was
  verified while rasterising it at full resolution.
- **Recording starts when the page opens**, so the app loading and settling lands ahead of the first
  beat. That lead-in is measured during the run and trimmed at encode time; otherwise every visual
  sits late against its narration and the last beat gets cut instead.

The narration and captions are one layer over the whole film, including over the recorded footage,
so a sentence is spoken and read at the same instant no matter what is underneath. The footage is
**fitted above the caption rather than run full-bleed under it** — full-bleed looked better on a
still and was worse to watch, because the caption sat on top of the member list and the amount
field, which is exactly what the sentence was talking about. The caption band is a fixed height for
the same reason: a four line sentence in a box anchored to the bottom edge grows upward into the
picture.

## Delivery

Upload `out/bareng-pitch.mp4` unlisted to YouTube and send the link. Sharing must be set so that
anyone with the link can view it.
