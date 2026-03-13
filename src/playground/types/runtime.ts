import type { AssetMode } from "../components/types";

export interface PlaygroundConfig {
  assetType: AssetMode;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  totalFrames: number | undefined;
  fps: number | undefined;
  duration: number | undefined;
  loop: boolean;
  position: {
    x: number;
    y: number;
  };
  scale: number;
  canvas: {
    width: number;
    height: number;
  };
}
