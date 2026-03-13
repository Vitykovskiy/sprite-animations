import test from "node:test";
import assert from "node:assert/strict";

import { createSpriteSheet } from "../dist/core/sprite-sheet.js";
import { createFrameSequence } from "../dist/core/frame-sequence.js";

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

test("createFrameSequence returns frame count from the provided image list", () => {
  const sequence = createFrameSequence({
    frames: [
      { width: 16, height: 16, tag: "frame-1" },
      { width: 24, height: 24, tag: "frame-2" },
    ],
  });

  assert.equal(sequence.getFrameCount(), 2);
});

test("createFrameSequence resolves frame metadata from the selected image", () => {
  const frame = { width: 20, height: 12, tag: "frame-2" };
  const sequence = createFrameSequence({
    frames: [{ width: 16, height: 16, tag: "frame-1" }, frame],
  });

  assert.deepEqual(sequence.getFrame(1), {
    image: frame,
    x: 0,
    y: 0,
    width: 20,
    height: 12,
    index: 1,
  });
});

test("createFrameSequence rejects an empty frame list", () => {
  assert.throws(
    () => createFrameSequence({ frames: [] }),
    /at least one image/,
  );
});
