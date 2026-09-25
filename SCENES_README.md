# Sanctuary scene assets

The Sanctuary (`app/components/sanctuary/`) currently renders every scene as a
generated CSS gradient — no photos, video, or audio required, and nothing is
hotlinked from anywhere. This file lists exactly what real media to source
later, and where each file goes, to replace those placeholders.

Do not hotlink external URLs in the app. Download the file, place it at the
path below, and add `poster` / `video` / `ambientAudio` to the matching entry
in `app/components/sanctuary/scenes.ts` (each field is currently absent/`undefined`).

Suggested sources for stills/video: Pexels, Unsplash, Coverr, Mixkit (all
have usable free-for-commercial-use licenses — confirm the specific asset's
license and note it in the `credit` field). Suggested source for audio:
Freesound.org, filtered to CC0.

## Format specs

- **Poster photo**: AVIF or WebP, ~2400px wide, plus a tiny (~20px wide)
  blurred placeholder for instant paint. Save both, e.g.
  `dawn-mist-lake.avif` and `dawn-mist-lake.blur.webp`.
- **Video loop** (water scenes only — golden-ocean-shore, golden-fern-waterfall):
  6-12s, seamless loop, 1080p, WebM/AV1 with an MP4 fallback, under ~3MB.
  Desktop + good-connection only; always show the poster first.
- **Ambient audio**: seamless loop, one per scene, CC0, normalized to a
  consistent perceived loudness across all scenes (the app plays at ~30%
  volume, so avoid mastering that's much louder/quieter than the others).

## Scenes and what each needs

Place files under `public/scenes/<id>/`.

| id | family | still | video | audio |
|---|---|---|---|---|
| dawn-mist-lake | dawn | mist lifting off a mountain lake | — | distant birds, soft water |
| dawn-snow-peaks | dawn | first sun touching snowy peaks | — | distant birds, soft water |
| dawn-pine-valley | dawn | fog in a pine valley | — | distant birds, soft water |
| day-meadow-horses | day | clouds drifting over a green meadow, horses grazing far away | — | forest birds, breeze, leaves |
| day-forest-canopy | day | sunlight through a deep forest canopy | — | forest birds, breeze, leaves |
| day-clear-sky | day | clear sky, birds gliding high | — | forest birds, breeze, leaves |
| day-rain-leaves | day | gentle rain on leaves | — | soft rain on leaves |
| golden-rolling-hills | golden | warm light over rolling hills / tall grass | — | waves, gentle stream |
| golden-ocean-shore | golden | calm ocean shore, slow waves | optional seamless loop | waves, gentle stream |
| golden-fern-waterfall | golden | a waterfall in a fern valley | optional seamless loop | waves, gentle stream |
| golden-fireflies-meadow | golden | fireflies at dusk over a meadow | — | crickets, soft wind |
| night-starry-mountains | night | a sky full of stars over dark mountains | — | crickets, soft wind, very low |
| night-aurora-ridge | night | slow aurora over a snowy ridge | — | crickets, soft wind, very low |
| night-moonlit-lake | night | a still, moonlit lake | — | crickets, soft wind, very low |

## Wiring a sourced asset in

1. Download the file, place it under `public/scenes/<id>/` as above.
2. In `scenes.ts`, add the fields to that scene's entry, e.g.:
   ```ts
   poster: "/scenes/dawn-mist-lake/poster.avif",
   ambientAudio: "/scenes/dawn-mist-lake/ambient.mp3",
   credit: "Photo by <name> on Pexels — Pexels License",
   ```
3. `Sanctuary.tsx` prefers `poster`/`video` over the `gradient` placeholder
   automatically once present — no other code changes needed.
