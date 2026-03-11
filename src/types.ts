export interface SpriteSheetGrid {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  totalFrames?: number;
}

export interface SpriteSheetConfig {
  image: CanvasImageSource;
  grid: SpriteSheetGrid;
}

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

export interface SpriteSheet {
  readonly image: CanvasImageSource;
  readonly grid: Required<SpriteSheetGrid>;
  getFrameCount(): number;
  getFrameRect(frameIndex: number): FrameRect;
}

export interface AnimationTimingConfig {
  fps?: number;
  duration?: number;
  loop?: boolean;
}

export interface AnimationPlayerConfig extends AnimationTimingConfig {
  totalFrames: number;
  initialFrame?: number;
}

export type AnimationPlaybackState = "idle" | "playing" | "paused" | "stopped";

export interface AnimationSnapshot {
  frameIndex: number;
  elapsedMs: number;
  playbackState: AnimationPlaybackState;
  completed: boolean;
}

export interface AnimationPlayer {
  readonly config: Readonly<AnimationPlayerConfig>;
  play(): void;
  pause(): void;
  stop(): void;
  reset(): void;
  update(deltaMs: number): AnimationSnapshot;
  getSnapshot(): AnimationSnapshot;
}

export interface RenderPosition {
  x: number;
  y: number;
}

export interface DrawSpriteOptions {
  scale?: number;
  position: RenderPosition;
  frameIndex: number;
  destinationWidth?: number;
  destinationHeight?: number;
}

export interface CanvasSpriteRenderer {
  draw(
    context: CanvasRenderingContext2D,
    spriteSheet: SpriteSheet,
    options: DrawSpriteOptions,
  ): void;
}
