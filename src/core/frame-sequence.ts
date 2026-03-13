import type {
  DrawableFrame,
  FrameSequence,
  FrameSequenceConfig,
  FrameSequenceImage,
} from "../types.js";

export function createFrameSequence(config: FrameSequenceConfig): FrameSequence {
  const frames = normalizeFrames(config.frames);

  return {
    frames,
    getFrameCount() {
      return frames.length;
    },
    getFrame(frameIndex) {
      return resolveFrame(frames, frameIndex);
    },
  };
}

function normalizeFrames(frames: FrameSequenceImage[]): readonly FrameSequenceImage[] {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("frames must contain at least one image.");
  }

  return frames;
}

function resolveFrame(
  frames: readonly FrameSequenceImage[],
  frameIndex: number,
): DrawableFrame {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("frameIndex must be a non-negative integer.");
  }

  if (frameIndex >= frames.length) {
    throw new Error("frameIndex is outside the configured frame sequence range.");
  }

  const image = frames[frameIndex];

  if (!image) {
    throw new Error("frameIndex is outside the configured frame sequence range.");
  }

  const dimensions = getImageDimensions(image);

  return {
    image,
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    index: frameIndex,
  };
}

function getImageDimensions(image: FrameSequenceImage): { width: number; height: number } {
  if ("naturalWidth" in image && "naturalHeight" in image) {
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  if ("width" in image && "height" in image) {
    return {
      width: image.width,
      height: image.height,
    };
  }

  throw new Error("Frame image must expose width and height.");
}
