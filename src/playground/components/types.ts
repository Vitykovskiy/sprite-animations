export type AssetMode = "sprite-sheet" | "frame-sequence";

export interface PlaygroundGridForm {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  totalFrames: number | string;
}

export interface PlaygroundTimingForm {
  fps: number | string;
  duration: number | string;
  loop: boolean;
}

export interface PlaygroundTransformForm {
  positionX: number;
  positionY: number;
  scale: number;
  gridOpacity: number;
}

export interface PlaygroundCanvasForm {
  canvasWidth: number;
  canvasHeight: number;
}
