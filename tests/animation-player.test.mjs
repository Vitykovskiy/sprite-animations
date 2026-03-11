import test from "node:test";
import assert from "node:assert/strict";

import { createAnimationPlayer } from "../dist/core/animation-player.js";

test("animation player advances frames using fps timing when duration is not set", () => {
  const player = createAnimationPlayer({
    totalFrames: 4,
    fps: 10,
    loop: true,
  });

  player.play();

  assert.equal(player.update(50).frameIndex, 0);
  assert.equal(player.update(50).frameIndex, 1);
  assert.equal(player.update(200).frameIndex, 3);
});

test("animation player uses duration to resolve frames when duration is provided", () => {
  const player = createAnimationPlayer({
    totalFrames: 10,
    duration: 1000,
    loop: false,
  });

  player.play();

  assert.equal(player.update(500).frameIndex, 5);
});

test("duration has priority over fps and allows frame skipping", () => {
  const player = createAnimationPlayer({
    totalFrames: 10,
    fps: 2,
    duration: 1000,
    loop: false,
  });

  player.play();

  const snapshot = player.update(500);

  assert.equal(snapshot.frameIndex, 5);
  assert.equal(snapshot.playbackState, "playing");
});

test("non-looping animation stops on the last frame when complete", () => {
  const player = createAnimationPlayer({
    totalFrames: 4,
    duration: 1000,
    loop: false,
  });

  player.play();

  const snapshot = player.update(1000);

  assert.equal(snapshot.frameIndex, 3);
  assert.equal(snapshot.playbackState, "stopped");
  assert.equal(snapshot.completed, true);
});

test("paused animation does not advance until playback resumes", () => {
  const player = createAnimationPlayer({
    totalFrames: 4,
    fps: 8,
    loop: true,
  });

  player.play();
  player.update(125);
  player.pause();

  assert.equal(player.update(1000).frameIndex, 1);

  player.play();
  assert.equal(player.update(125).frameIndex, 2);
});
