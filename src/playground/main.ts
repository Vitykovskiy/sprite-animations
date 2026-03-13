import "../playground/styles.css";

import {
  createAnimationPlayer,
  createCanvasSpriteRenderer,
  createSpriteSheet,
  loadSpriteSheetImage,
} from "../index.js";
import type {
  AnimationPlayer,
  LoadedSpriteSheetImage,
  SpriteSheet,
} from "../types.js";

interface PlaygroundConfig {
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

const renderer = createCanvasSpriteRenderer();

const elements = {
  assetFile: getInputElement<HTMLInputElement>("asset-file"),
  assetStatus: getElement<HTMLElement>("asset-status"),
  assetMeta: getElement<HTMLElement>("asset-meta"),
  frameWidth: getInputElement<HTMLInputElement>("frame-width"),
  frameHeight: getInputElement<HTMLInputElement>("frame-height"),
  columns: getInputElement<HTMLInputElement>("columns"),
  rows: getInputElement<HTMLInputElement>("rows"),
  totalFrames: getInputElement<HTMLInputElement>("total-frames"),
  fps: getInputElement<HTMLInputElement>("fps"),
  duration: getInputElement<HTMLInputElement>("duration"),
  loop: getInputElement<HTMLInputElement>("loop"),
  positionX: getInputElement<HTMLInputElement>("position-x"),
  positionY: getInputElement<HTMLInputElement>("position-y"),
  scale: getInputElement<HTMLInputElement>("scale"),
  gridVisibility: getInputElement<HTMLInputElement>("grid-visibility"),
  canvasWidth: getInputElement<HTMLInputElement>("canvas-width"),
  canvasHeight: getInputElement<HTMLInputElement>("canvas-height"),
  playButton: getElement<HTMLButtonElement>("play-button"),
  pauseButton: getElement<HTMLButtonElement>("pause-button"),
  stopButton: getElement<HTMLButtonElement>("stop-button"),
  saveConfig: getElement<HTMLButtonElement>("save-config"),
  copyConfig: getElement<HTMLButtonElement>("copy-config"),
  configOutput: getElement<HTMLTextAreaElement>("config-output"),
  currentFrame: getElement<HTMLElement>("current-frame"),
  playbackState: getElement<HTMLElement>("playback-state"),
  previewMessage: getElement<HTMLElement>("preview-message"),
  previewCanvas: getElement<HTMLCanvasElement>("preview-canvas"),
};

const previewContext = elements.previewCanvas.getContext("2d");

if (!previewContext) {
  throw new Error("Playground requires a 2D canvas context.");
}

const context: CanvasRenderingContext2D = previewContext;

let loadedImage: LoadedSpriteSheetImage | null = null;
let spriteSheet: SpriteSheet | null = null;
let player: AnimationPlayer | null = null;
let previousTimestamp = 0;
let activeObjectUrl: string | null = null;

bindEvents();
syncCanvasSize();
syncRuntime({ autoplay: false });
window.requestAnimationFrame(tick);

function bindEvents(): void {
  elements.assetFile.addEventListener("change", handleAssetSelection);

  const runtimeInputs = [
    elements.frameWidth,
    elements.frameHeight,
    elements.columns,
    elements.rows,
    elements.totalFrames,
    elements.fps,
    elements.duration,
    elements.loop,
    elements.positionX,
    elements.positionY,
    elements.scale,
  ];

  runtimeInputs.forEach((element) =>
    element.addEventListener("input", () => syncRuntime({ autoplay: false })),
  );

  [elements.canvasWidth, elements.canvasHeight].forEach((element) =>
    element.addEventListener("input", () => {
      syncCanvasSize();
      syncRuntime({ autoplay: false });
    }),
  );

  elements.gridVisibility.addEventListener("input", drawPreviewFrame);
  elements.playButton.addEventListener("click", () => {
    player?.play();
  });
  elements.pauseButton.addEventListener("click", () => {
    player?.pause();
    updatePlaybackMetrics();
  });
  elements.stopButton.addEventListener("click", () => {
    player?.stop();
    updatePlaybackMetrics();
    drawPreviewFrame();
  });
  elements.saveConfig.addEventListener("click", saveConfigToFile);
  elements.copyConfig.addEventListener("click", copyConfigToClipboard);
}

async function handleAssetSelection(): Promise<void> {
  const file = elements.assetFile.files?.[0];

  if (!file) {
    loadedImage = null;
    spriteSheet = null;
    player = null;
    updateAssetStatus();
    drawPreviewFrame();
    return;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
  }

  activeObjectUrl = URL.createObjectURL(file);

  try {
    loadedImage = await loadSpriteSheetImage(activeObjectUrl);
    elements.previewMessage.textContent =
      "Preview ready. Adjust the controls on the left to refine the runtime.";
    updateAssetStatus(file.name);
    syncRuntime({ autoplay: true });
  } catch (error) {
    loadedImage = null;
    spriteSheet = null;
    player = null;
    const message =
      error instanceof Error ? error.message : "Failed to load the selected file.";
    elements.assetStatus.textContent = "Asset load failed";
    elements.assetMeta.textContent = message;
    elements.previewMessage.textContent = message;
    drawPreviewFrame();
  }
}

function syncRuntime(options: { autoplay: boolean }): void {
  syncCanvasSize();

  const config = readConfig();
  elements.configOutput.value = serializeConfig(config);

  if (!loadedImage) {
    updatePlaybackMetrics();
    drawPreviewFrame();
    return;
  }

  try {
    spriteSheet = createSpriteSheet({
      image: loadedImage.image,
      grid: {
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight,
        columns: config.columns,
        rows: config.rows,
        ...(config.totalFrames === undefined
          ? {}
          : { totalFrames: config.totalFrames }),
      },
    });

    player = createAnimationPlayer({
      totalFrames: spriteSheet.getFrameCount(),
      ...(config.fps === undefined ? {} : { fps: config.fps }),
      ...(config.duration === undefined ? {} : { duration: config.duration }),
      loop: config.loop,
    });

    if (options.autoplay) {
      player.play();
    }

    updatePlaybackMetrics();
    drawPreviewFrame();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid runtime configuration.";
    elements.previewMessage.textContent = message;
  }
}

function tick(timestamp: number): void {
  const deltaMs = previousTimestamp === 0 ? 0 : timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  if (player) {
    player.update(deltaMs);
    updatePlaybackMetrics();
    drawPreviewFrame();
  } else {
    drawPreviewFrame();
  }

  window.requestAnimationFrame(tick);
}

function drawPreviewFrame(): void {
  const config = readConfig();
  const visibility = readNumber(elements.gridVisibility, 0.4);

  context.clearRect(0, 0, elements.previewCanvas.width, elements.previewCanvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, elements.previewCanvas.width, elements.previewCanvas.height);
  drawCanvasGrid(visibility);

  if (!loadedImage || !spriteSheet || !player) {
    drawPlaceholder();
    return;
  }

  const snapshot = player.getSnapshot();

  renderer.draw(context, spriteSheet, {
    frameIndex: snapshot.frameIndex,
    position: config.position,
    scale: config.scale,
  });
}

function drawCanvasGrid(visibility: number): void {
  const alpha = Math.max(0, Math.min(1, visibility));
  context.save();
  context.strokeStyle = `rgba(26, 26, 26, ${alpha * 0.12})`;
  context.lineWidth = 1;

  for (let x = 0; x < elements.previewCanvas.width; x += 32) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, elements.previewCanvas.height);
    context.stroke();
  }

  for (let y = 0; y < elements.previewCanvas.height; y += 32) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(elements.previewCanvas.width, y + 0.5);
    context.stroke();
  }

  context.restore();
}

function drawPlaceholder(): void {
  context.save();
  context.fillStyle = "rgba(26, 26, 26, 0.56)";
  context.textAlign = "center";
  context.font = '500 16px "Aptos", "Segoe UI", sans-serif';
  context.fillText(
    "Load a sprite sheet to preview the animation runtime.",
    elements.previewCanvas.width / 2,
    elements.previewCanvas.height / 2,
  );
  context.restore();
}

function updateAssetStatus(fileName?: string): void {
  if (!loadedImage) {
    elements.assetStatus.textContent = "No asset loaded";
    elements.assetMeta.textContent = "Choose a local sprite sheet image to begin.";
    return;
  }

  elements.assetStatus.textContent = fileName ?? "Sprite sheet loaded";
  elements.assetMeta.textContent = `${loadedImage.width} x ${loadedImage.height} px`;
}

function updatePlaybackMetrics(): void {
  const snapshot = player?.getSnapshot();
  elements.currentFrame.textContent = String(snapshot?.frameIndex ?? 0);
  elements.playbackState.textContent = snapshot?.playbackState ?? "idle";
}

function syncCanvasSize(): void {
  const width = readNumber(elements.canvasWidth, 640);
  const height = readNumber(elements.canvasHeight, 360);
  elements.previewCanvas.width = width;
  elements.previewCanvas.height = height;
}

function readConfig(): PlaygroundConfig {
  return {
    frameWidth: readNumber(elements.frameWidth, 64),
    frameHeight: readNumber(elements.frameHeight, 64),
    columns: readNumber(elements.columns, 4),
    rows: readNumber(elements.rows, 4),
    totalFrames: readOptionalNumber(elements.totalFrames),
    fps: readOptionalNumber(elements.fps),
    duration: readOptionalNumber(elements.duration),
    loop: elements.loop.checked,
    position: {
      x: readNumber(elements.positionX, 160),
      y: readNumber(elements.positionY, 120),
    },
    scale: readNumber(elements.scale, 2),
    canvas: {
      width: readNumber(elements.canvasWidth, 640),
      height: readNumber(elements.canvasHeight, 360),
    },
  };
}

function serializeConfig(config: PlaygroundConfig): string {
  return JSON.stringify(config, null, 2);
}

async function copyConfigToClipboard(): Promise<void> {
  const json = serializeConfig(readConfig());
  elements.configOutput.value = json;

  try {
    await navigator.clipboard.writeText(json);
    elements.previewMessage.textContent = "JSON config copied to clipboard.";
  } catch {
    elements.previewMessage.textContent = "Clipboard write failed. Copy the JSON manually.";
  }
}

function saveConfigToFile(): void {
  const json = serializeConfig(readConfig());
  elements.configOutput.value = json;

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "sprite-animation.config.json";
  anchor.click();
  URL.revokeObjectURL(url);

  elements.previewMessage.textContent = "JSON config saved.";
}

function readNumber(element: HTMLInputElement, fallback: number): number {
  const value = Number(element.value);
  return Number.isFinite(value) ? value : fallback;
}

function readOptionalNumber(element: HTMLInputElement): number | undefined {
  if (element.value.trim() === "") {
    return undefined;
  }

  const value = Number(element.value);
  return Number.isFinite(value) ? value : undefined;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }

  return element as T;
}

function getInputElement<T extends HTMLInputElement>(id: string): T {
  return getElement<T>(id);
}
