import type {
  AnimationPlayer,
  AnimationPlayerConfig,
  AnimationPlaybackState,
  AnimationSnapshot,
} from "../types.js";

export function createAnimationPlayer(
  config: AnimationPlayerConfig,
): AnimationPlayer {
  const normalizedConfig = normalizeAnimationPlayerConfig(config);

  let playbackState: AnimationPlaybackState = "idle";
  let elapsedMs = 0;
  let frameIndex = normalizedConfig.initialFrame;
  let completed = false;

  const snapshot = (): AnimationSnapshot => ({
    frameIndex,
    elapsedMs,
    playbackState,
    completed,
  });

  return {
    config: toPublicAnimationPlayerConfig(normalizedConfig),
    play() {
      playbackState = "playing";
      completed = false;
    },
    pause() {
      if (playbackState === "playing") {
        playbackState = "paused";
      }
    },
    stop() {
      playbackState = "stopped";
      elapsedMs = 0;
      frameIndex = normalizedConfig.initialFrame;
      completed = false;
    },
    reset() {
      playbackState = "idle";
      elapsedMs = 0;
      frameIndex = normalizedConfig.initialFrame;
      completed = false;
    },
    update(deltaMs) {
      if (playbackState !== "playing" || deltaMs <= 0) {
        return snapshot();
      }

      elapsedMs += deltaMs;

      if (normalizedConfig.duration !== undefined) {
        const duration = normalizedConfig.duration;

        if (duration <= 0) {
          frameIndex = normalizedConfig.totalFrames - 1;
          completed = true;
          playbackState = normalizedConfig.loop ? "playing" : "stopped";
          return snapshot();
        }

        const cycles = elapsedMs / duration;

        if (!normalizedConfig.loop && cycles >= 1) {
          frameIndex = normalizedConfig.totalFrames - 1;
          elapsedMs = duration;
          completed = true;
          playbackState = "stopped";
          return snapshot();
        }

        const cycleProgress = normalizedConfig.loop
          ? cycles - Math.floor(cycles)
          : Math.min(cycles, 0.999999);

        frameIndex = Math.min(
          normalizedConfig.totalFrames - 1,
          Math.floor(cycleProgress * normalizedConfig.totalFrames),
        );
        return snapshot();
      }

      const frameDurationMs = 1000 / normalizedConfig.fps;
      const nextFrameIndex =
        normalizedConfig.initialFrame +
        Math.floor(elapsedMs / frameDurationMs);

      if (normalizedConfig.loop) {
        frameIndex = nextFrameIndex % normalizedConfig.totalFrames;
        return snapshot();
      }

      if (nextFrameIndex >= normalizedConfig.totalFrames) {
        frameIndex = normalizedConfig.totalFrames - 1;
        completed = true;
        playbackState = "stopped";
        return snapshot();
      }

      frameIndex = nextFrameIndex;
      return snapshot();
    },
    getSnapshot() {
      return snapshot();
    },
  };
}

interface NormalizedAnimationPlayerConfig {
  totalFrames: number;
  initialFrame: number;
  fps: number;
  duration: number | undefined;
  loop: boolean;
}

function normalizeAnimationPlayerConfig(
  config: AnimationPlayerConfig,
): Readonly<NormalizedAnimationPlayerConfig> {
  if (!Number.isInteger(config.totalFrames) || config.totalFrames <= 0) {
    throw new Error("Animation player requires a positive integer totalFrames.");
  }

  if (config.fps !== undefined && config.fps <= 0) {
    throw new Error("fps must be greater than 0 when provided.");
  }

  if (config.duration !== undefined && config.duration < 0) {
    throw new Error("duration must be greater than or equal to 0 when provided.");
  }

  const initialFrame = config.initialFrame ?? 0;

  if (!Number.isInteger(initialFrame) || initialFrame < 0) {
    throw new Error("initialFrame must be a non-negative integer.");
  }

  if (initialFrame >= config.totalFrames) {
    throw new Error("initialFrame must be less than totalFrames.");
  }

  return Object.freeze({
    totalFrames: config.totalFrames,
    initialFrame,
    fps: config.fps ?? 12,
    duration: config.duration,
    loop: config.loop ?? true,
  });
}

function toPublicAnimationPlayerConfig(
  config: Readonly<NormalizedAnimationPlayerConfig>,
): Readonly<AnimationPlayerConfig> {
  return Object.freeze({
    totalFrames: config.totalFrames,
    initialFrame: config.initialFrame,
    fps: config.fps,
    ...(config.duration === undefined ? {} : { duration: config.duration }),
    loop: config.loop,
  });
}
