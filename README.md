# The Penthouse — a scroll-driven apartment tour

A single-page site that moves the visitor through an apartment as they scroll.
Each "scene" is a Higgsfield transition clip that is **scrubbed by scroll
position** (scroll down = play forward, scroll up = rewind), with a text block
that fades in over each room. Where there is no clip — the move from the living
room into the master bedroom — a **blur dissolve** is generated in the browser.

No build step, no dependencies. Open `index.html` and it runs.

## Run it locally

Because the page loads video files, use a tiny static server (opening the file
directly with `file://` blocks video loading in some browsers):

```bash
cd penthouse
python3 -m http.server 8000
# then open http://localhost:8000
```

## The tour sequence

| # | Scene | Clip | Type |
|---|-------|------|------|
| 1 | Living Room | `assets/videos/01-living-room.mp4` | scroll-scrubbed video |
| 2 | Living Room → Master Bedroom | *(none)* | **blur dissolve** |
| 3 | Master Bedroom | `assets/videos/03-master-bedroom.mp4` | scroll-scrubbed video |
| 4 | Walk-in Closet | `assets/videos/04-walk-in-closet.mp4` | scroll-scrubbed video |
| 5 | Toilet / Bathroom | `assets/videos/05-bathroom.mp4` | scroll-scrubbed video |

The whole tour runs on **one continuous timeline**: a single stage is pinned for
the entire sequence, so the instant one clip reaches its last frame the next
takes over on its first frame — no jump and no dead scroll between transitions.
This relies on the clips being authored so each starts where the previous ended.

The blur scene holds the **living-room clip on its last frame** beneath the
**bedroom clip on its first frame**. It first **pushes in toward the mirror wall**
(`focus` sets the focal point, `zoom` the amount), then blurs + cross-fades into
the bedroom — and it stays in sync even if you swap either clip.

## Changing anything

Everything is driven by **`js/config.js`** — it's the only file you need to edit
to change rooms, order, pacing, or text:

- **Text** — edit each scene's `heading` and `copy` (currently placeholder copy).
- **Add / remove / reorder rooms** — add or move entries in the `scenes` array.
- **Swap a clip** — change a scene's `src`, or drop a file in `assets/videos/`
  using the same name.
- **Pacing / scroll speed** — `length` is how many viewport-heights of scroll
  the clip is stretched over. Lower = the clip plays faster with less scrolling
  (and feels snappier); higher = slower. `~1.5` is the current default.
- **Blur push-in** — on the blur scene, `focus` ("x% y%" from the top-left)
  aims the zoom at the mirror wall and `zoom` sets how far it pushes in.
- **Accent colour** — `accent` tints the gradient behind the clip and the nav dot.

To turn another transition into a blur (or add a new blur step), set its
`type` to `"blur"` and give it `fromVideo` and `toVideo` instead of `src`.

## Notes

- Clips are muted and `playsinline` so they scrub smoothly on mobile.
- Scrubbing quality depends on the clip's keyframes; short clips (a few seconds)
  scrub most smoothly.
- Respects `prefers-reduced-motion`.
