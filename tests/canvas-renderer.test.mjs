import test from "node:test";
import assert from "node:assert/strict";

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
