import test from "node:test";
import assert from "node:assert/strict";

import { createSpriteSheet } from "../dist/core/sprite-sheet.js";

test("createSpriteSheet computes frame count from the configured grid", () => {
  const spriteSheet = createSpriteSheet({
    image: {},
    grid: {
      frameWidth: 32,
      frameHeight: 48,
      columns: 4,
      rows: 3,
    },
  });

  assert.equal(spriteSheet.getFrameCount(), 12);
});

test("createSpriteSheet computes frame rectangles by index", () => {
  const spriteSheet = createSpriteSheet({
    image: {},
    grid: {
      frameWidth: 32,
      frameHeight: 48,
      columns: 4,
      rows: 3,
      totalFrames: 10,
    },
  });

  assert.deepEqual(spriteSheet.getFrameRect(5), {
    x: 32,
    y: 48,
    width: 32,
    height: 48,
    index: 5,
  });
});

test("createSpriteSheet rejects frame indexes outside totalFrames", () => {
  const spriteSheet = createSpriteSheet({
    image: {},
    grid: {
      frameWidth: 16,
      frameHeight: 16,
      columns: 2,
      rows: 2,
      totalFrames: 3,
    },
  });

  assert.throws(
    () => spriteSheet.getFrameRect(3),
    /outside the configured totalFrames range/,
  );
});

test("createSpriteSheet rejects totalFrames larger than grid capacity", () => {
  assert.throws(
    () =>
      createSpriteSheet({
        image: {},
        grid: {
          frameWidth: 16,
          frameHeight: 16,
          columns: 2,
          rows: 2,
          totalFrames: 5,
        },
      }),
    /cannot exceed the capacity/,
  );
});
