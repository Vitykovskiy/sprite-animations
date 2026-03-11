# sprite-animations

`sprite-animations` is a framework-agnostic TypeScript library for 2D sprite animation on HTML canvas.

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

- `sprite-animations`
- `sprite-animations/core`
- `sprite-animations/renderers`
- `sprite-animations/types`

## Public API draft

```ts
import {
  createAnimationPlayer,
  createCanvasSpriteRenderer,
  createSpriteSheet,
} from "sprite-animations";

const spriteSheet = createSpriteSheet({
  image,
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

- `createSpriteSheet(...)`
  Defines the sprite grid contract and frame lookup API.

- `createAnimationPlayer(...)`
  Owns playback state and timing policy.

- `createCanvasSpriteRenderer(...)`
  Draws a resolved frame to a canvas context without owning playback state.

## Status

This repository is in active MVP setup. The package structure and public API are defined first; asset loading, runtime behavior hardening, playground UX, and publish-ready infrastructure are tracked as separate backlog tasks.
