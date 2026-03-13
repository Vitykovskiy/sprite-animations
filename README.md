# @vitykovskiy/canvas-sprite-animations

Framework-agnostic TypeScript library for 2D sprite animation on HTML canvas.

## Install

```bash
npm install @vitykovskiy/canvas-sprite-animations
```

## Usage

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

## Entry Points

- `@vitykovskiy/canvas-sprite-animations`
- `@vitykovskiy/canvas-sprite-animations/core`
- `@vitykovskiy/canvas-sprite-animations/renderers`
- `@vitykovskiy/canvas-sprite-animations/types`

## API

- `loadSpriteSheetImage(...)`
  Loads a sprite sheet from a URL, `HTMLImageElement`, or `ImageBitmap`.

- `createSpriteSheet(...)`
  Creates a regular-grid sprite sheet model.

- `createAnimationPlayer(...)`
  Controls playback state and frame timing.

- `createCanvasSpriteRenderer(...)`
  Draws a resolved frame to `CanvasRenderingContext2D`.

## Timing Policy

- If only `fps` is set, playback advances frame-by-frame.
- If only `duration` is set, frames are resolved from elapsed progress.
- If both `fps` and `duration` are set, `duration` has priority and `fps` acts as an update cap.

## Scope

Current MVP scope:

- regular grid sprite sheets
- canvas rendering
- runtime playback with `fps` and/or `duration`
- predictable positioning and scaling

Not included in MVP:

- JSON atlas support
- framework adapters
- WebGL renderer
- state machine / animation graph

## License

MIT
