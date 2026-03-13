import type { FrameRect, SpriteSheet, SpriteSheetConfig } from "../types.js";

export function createSpriteSheet(config: SpriteSheetConfig): SpriteSheet {
  const normalizedGrid = normalizeGrid(config);

  return {
    image: config.image,
    grid: normalizedGrid,
    getFrameCount() {
      return normalizedGrid.totalFrames;
    },
    getFrameRect(frameIndex) {
      return getFrameRect(normalizedGrid, frameIndex);
    },
    getFrame(frameIndex) {
      const frame = getFrameRect(normalizedGrid, frameIndex);

      return {
        ...frame,
        image: config.image,
      };
    },
  };
}

function normalizeGrid(
  config: SpriteSheetConfig,
): Required<SpriteSheetConfig["grid"]> {
  const { frameWidth, frameHeight, columns, rows } = config.grid;

  if (frameWidth <= 0 || frameHeight <= 0) {
    throw new Error("frameWidth and frameHeight must be greater than 0.");
  }

  if (!Number.isInteger(columns) || columns <= 0) {
    throw new Error("columns must be a positive integer.");
  }

  if (!Number.isInteger(rows) || rows <= 0) {
    throw new Error("rows must be a positive integer.");
  }

  const totalFrames = config.grid.totalFrames ?? columns * rows;

  if (!Number.isInteger(totalFrames) || totalFrames <= 0) {
    throw new Error("totalFrames must be a positive integer when provided.");
  }

  if (totalFrames > columns * rows) {
    throw new Error(
      "totalFrames cannot exceed the capacity of the sprite sheet grid.",
    );
  }

  return {
    frameWidth,
    frameHeight,
    columns,
    rows,
    totalFrames,
  };
}

function getFrameRect(
  grid: Required<SpriteSheetConfig["grid"]>,
  frameIndex: number,
): FrameRect {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("frameIndex must be a non-negative integer.");
  }

  if (frameIndex >= grid.totalFrames) {
    throw new Error("frameIndex is outside the configured totalFrames range.");
  }

  const columnIndex = frameIndex % grid.columns;
  const rowIndex = Math.floor(frameIndex / grid.columns);

  return {
    x: columnIndex * grid.frameWidth,
    y: rowIndex * grid.frameHeight,
    width: grid.frameWidth,
    height: grid.frameHeight,
    index: frameIndex,
  };
}
