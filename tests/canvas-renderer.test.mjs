import test from "node:test";
import assert from "node:assert/strict";

import { createFrameSequence } from "../dist/core/frame-sequence.js";
import { createSpriteSheet } from "../dist/core/sprite-sheet.js";
import { createCanvasSpriteRenderer } from "../dist/renderers/create-canvas-sprite-renderer.js";

test("canvas renderer draws the requested frame using position and scale", () => {
  const calls = [];
  const context = {
    drawImage: (...args) => {
      calls.push(args);
    },
  };

  const spriteSheet = createSpriteSheet({
    image: { tag: "image" },
    grid: {
      frameWidth: 32,
      frameHeight: 16,
      columns: 4,
      rows: 2,
    },
  });

  const renderer = createCanvasSpriteRenderer();

  renderer.draw(context, spriteSheet, {
    frameIndex: 5,
    position: { x: 10, y: 20 },
    scale: 2,
  });

  assert.deepEqual(calls, [
    [
      { tag: "image" },
      32,
      16,
      32,
      16,
      10,
      20,
      64,
      32,
    ],
  ]);
});

test("canvas renderer draws the requested frame from a frame sequence", () => {
  const calls = [];
  const context = {
    drawImage: (...args) => {
      calls.push(args);
    },
  };

  const frameSequence = createFrameSequence({
    frames: [
      { width: 10, height: 12, tag: "frame-1" },
      { width: 14, height: 18, tag: "frame-2" },
    ],
  });

  const renderer = createCanvasSpriteRenderer();

  renderer.draw(context, frameSequence, {
    frameIndex: 1,
    position: { x: 5, y: 8 },
    scale: 2,
  });

  assert.deepEqual(calls, [
    [
      { width: 14, height: 18, tag: "frame-2" },
      0,
      0,
      14,
      18,
      5,
      8,
      28,
      36,
    ],
  ]);
});
