# @vitykovskiy/canvas-sprite-animations

`@vitykovskiy/canvas-sprite-animations` is a framework-agnostic TypeScript library for 2D sprite animation on HTML canvas.

The current MVP focus is deliberately narrow:
- regular grid sprite sheets;
- runtime playback on `CanvasRenderingContext2D`;
- timing via `fps` and/or `duration`;
- predictable positioning and scaling;
- a separate playground for asset validation and config tuning.

## Current package structure

```text
src/
  core/
    animation-player.ts
    sprite-sheet.ts
    index.ts
  renderers/
    create-canvas-sprite-renderer.ts
    index.ts
  types.ts
  index.ts
```

## Public entry points

- `@vitykovskiy/canvas-sprite-animations`
- `@vitykovskiy/canvas-sprite-animations/core`
- `@vitykovskiy/canvas-sprite-animations/renderers`
- `@vitykovskiy/canvas-sprite-animations/types`

## Public API draft

```ts
import {
  createAnimationPlayer,
  createCanvasSpriteRenderer,
  createSpriteSheet,
  loadSpriteSheetImage,
} from "@vitykovskiy/canvas-sprite-animations";

const loadedImage = await loadSpriteSheetImage("/assets/hero.png");

const spriteSheet = createSpriteSheet({
  image: loadedImage.image,
  grid: {
    frameWidth: 64,
    frameHeight: 64,
    columns: 8,
    rows: 4,
    totalFrames: 24,
  },
});

const player = createAnimationPlayer({
  totalFrames: spriteSheet.getFrameCount(),
  fps: 12,
  duration: 1500,
  loop: true,
});

const renderer = createCanvasSpriteRenderer();
```

## API responsibilities

- `loadSpriteSheetImage(...)`
  Loads a sprite sheet from a URL, `HTMLImageElement`, or `ImageBitmap`.

- `createSpriteSheet(...)`
  Defines the sprite grid contract and frame lookup API.

- `createAnimationPlayer(...)`
  Owns playback state and timing policy.

- `createCanvasSpriteRenderer(...)`
  Draws a resolved frame to a canvas context without owning playback state.

## Timing policy

- If only `fps` is set, playback advances frame-by-frame using frame duration.
- If only `duration` is set, frames are resolved from elapsed progress across the full animation.
- If both `fps` and `duration` are set, `duration` has priority and `fps` acts as an update-frequency cap, which means frame skipping is allowed.

## Canvas rendering contract

- The renderer only draws a requested frame.
- Positioning is controlled through `{ x, y }` draw options.
- Scaling is applied at draw time and does not mutate sprite sheet metadata.

## Status

This repository is in active MVP setup. The package structure and public API are defined first; asset loading, runtime behavior hardening, playground UX, and publish-ready infrastructure are tracked as separate backlog tasks.

## Validation

Current scaffold validation commands:

```bash
tsc --noEmit -p tsconfig.json
npm test
npm run playground:build
npm pack --dry-run
```

## Playground

Run the dev playground locally:

```bash
npm install
npm run playground:dev
```

## Package workflow

- `npm run build`
  Builds library artifacts into `dist/` without bundling the playground.

- `npm test`
  Rebuilds the library and runs runtime regression tests.

- `npm run check`
  Runs typecheck, tests, and playground build as a single quality gate.

- `npm run pack:check`
  Verifies the package contents with `npm pack --dry-run`.

- `npm run playground:build`
  Emits the dev playground into `playground-dist/` so it does not overwrite library artifacts in `dist/`.
