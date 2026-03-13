import "../playground/styles.css";

import {
  createAnimationPlayer,
  createCanvasSpriteRenderer,
  createFrameSequence,
  createSpriteSheet,
  loadFrameSequence,
  loadSpriteSheetImage,
} from "../index.js";
import type {
  AnimationFrameSource,
  AnimationPlayer,
  FrameSequence,
  LoadedFrameImage,
  LoadedSpriteSheetImage,
  SpriteSheet,
} from "../types.js";

interface PlaygroundConfig {
  assetType: "sprite-sheet" | "frame-sequence";
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
  assetMode: getSelectElement<HTMLSelectElement>("asset-mode"),
  assetFile: getInputElement<HTMLInputElement>("asset-file"),
  assetPickerLabel: getElement<HTMLElement>("asset-picker-label"),
  assetStatus: getElement<HTMLElement>("asset-status"),
  assetMeta: getElement<HTMLElement>("asset-meta"),
  gridSection: getElement<HTMLElement>("grid-section"),
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
let loadedFrames: LoadedFrameImage[] = [];
let spriteSheet: SpriteSheet | null = null;
let frameSequence: FrameSequence | null = null;
let animationSource: AnimationFrameSource | null = null;
let player: AnimationPlayer | null = null;
let previousTimestamp = 0;
let activeObjectUrls: string[] = [];

bindEvents();
syncAssetMode();
updateAssetStatus();
syncCanvasSize();
syncRuntime({ autoplay: false });
window.requestAnimationFrame(tick);

function bindEvents(): void {
  elements.assetMode.addEventListener("change", handleAssetModeChange);
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
  const files = readSelectedFiles();

  if (files.length === 0) {
    resetLoadedAssets();
    updateAssetStatus();
    drawPreviewFrame();
    return;
  }

  releaseActiveObjectUrls();

  try {
    if (isFrameSequenceMode()) {
      const sortedFiles = [...files].sort(compareFrameFiles);
      activeObjectUrls = sortedFiles.map((file) => URL.createObjectURL(file));
      loadedFrames = await loadFrameSequence(activeObjectUrls);
      loadedImage = null;
      elements.previewMessage.textContent = "Frames loaded.";
      updateAssetStatus(`${loadedFrames.length} frames`);
    } else {
      const [file] = files;

      if (!file) {
        throw new Error("No image selected.");
      }

      const objectUrl = URL.createObjectURL(file);
      activeObjectUrls = [objectUrl];
      loadedImage = await loadSpriteSheetImage(objectUrl);
      loadedFrames = [];
      elements.previewMessage.textContent = "Image loaded.";
      updateAssetStatus(file.name);
    }

    syncRuntime({ autoplay: true });
  } catch (error) {
    resetLoadedAssets();
    const message =
      error instanceof Error ? error.message : "Failed to load file.";
    elements.assetStatus.textContent = "Load failed";
    elements.assetMeta.textContent = message;
    elements.previewMessage.textContent = message;
    drawPreviewFrame();
  }
}

function syncRuntime(options: { autoplay: boolean }): void {
  syncCanvasSize();
  syncAssetMode();

  const config = readConfig();
  elements.configOutput.value = serializeConfig(config);

  if (!hasLoadedAsset()) {
    animationSource = null;
    updatePlaybackMetrics();
    drawPreviewFrame();
    return;
  }

  try {
    if (isFrameSequenceMode()) {
      frameSequence = createFrameSequence({
        frames: loadedFrames.map((frame) => frame.image),
      });
      spriteSheet = null;
      animationSource = frameSequence;
    } else {
      if (!loadedImage) {
        throw new Error("No sprite sheet image loaded.");
      }

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
      frameSequence = null;
      animationSource = spriteSheet;
    }

    if (!animationSource) {
      throw new Error("No animation source available.");
    }

    player = createAnimationPlayer({
      totalFrames: animationSource.getFrameCount(),
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
      error instanceof Error ? error.message : "Invalid configuration.";
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

  if (!animationSource || !player) {
    drawPlaceholder();
    return;
  }

  const snapshot = player.getSnapshot();

  renderer.draw(context, animationSource, {
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
    isFrameSequenceMode() ? "Select a folder." : "Select an image.",
    elements.previewCanvas.width / 2,
    elements.previewCanvas.height / 2,
  );
  context.restore();
}

function updateAssetStatus(fileName?: string): void {
  if (!hasLoadedAsset()) {
    elements.assetStatus.textContent = "No asset loaded";
    elements.assetMeta.textContent = isFrameSequenceMode()
      ? "Select a folder with frames."
      : "Select a local image.";
    return;
  }

  elements.assetStatus.textContent = fileName ?? "Asset loaded";

  if (isFrameSequenceMode()) {
    const firstFrame = loadedFrames[0];

    elements.assetMeta.textContent = firstFrame
      ? `${loadedFrames.length} frames, first ${firstFrame.width} x ${firstFrame.height} px`
      : `${loadedFrames.length} frames`;
    return;
  }

  elements.assetMeta.textContent = loadedImage
    ? `${loadedImage.width} x ${loadedImage.height} px`
    : "Select a local image.";
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
    assetType: isFrameSequenceMode() ? "frame-sequence" : "sprite-sheet",
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
    elements.previewMessage.textContent = "JSON copied.";
  } catch {
    elements.previewMessage.textContent = "Copy failed.";
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

  elements.previewMessage.textContent = "JSON saved.";
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

function handleAssetModeChange(): void {
  resetLoadedAssets();
  elements.assetFile.value = "";
  syncAssetMode();
  updateAssetStatus();
  elements.previewMessage.textContent = isFrameSequenceMode()
    ? "Select a folder."
    : "Select an image.";
  syncRuntime({ autoplay: false });
}

function syncAssetMode(): void {
  const frameSequenceMode = isFrameSequenceMode();

  elements.assetPickerLabel.textContent = frameSequenceMode
    ? "Select folder"
    : "Select image";

  elements.assetFile.multiple = frameSequenceMode;

  if (frameSequenceMode) {
    elements.assetFile.setAttribute("webkitdirectory", "");
    elements.assetFile.setAttribute("directory", "");
  } else {
    elements.assetFile.removeAttribute("webkitdirectory");
    elements.assetFile.removeAttribute("directory");
  }

  const gridInputs = [
    elements.frameWidth,
    elements.frameHeight,
    elements.columns,
    elements.rows,
    elements.totalFrames,
  ];

  gridInputs.forEach((input) => {
    input.disabled = frameSequenceMode;
  });

  elements.gridSection.classList.toggle("is-disabled", frameSequenceMode);
}

function resetLoadedAssets(): void {
  loadedImage = null;
  loadedFrames = [];
  spriteSheet = null;
  frameSequence = null;
  animationSource = null;
  player = null;
  releaseActiveObjectUrls();
}

function releaseActiveObjectUrls(): void {
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls = [];
}

function hasLoadedAsset(): boolean {
  return loadedImage !== null || loadedFrames.length > 0;
}

function isFrameSequenceMode(): boolean {
  return elements.assetMode.value === "frame-sequence";
}

function readSelectedFiles(): File[] {
  return Array.from(elements.assetFile.files ?? []);
}

function compareFrameFiles(left: File, right: File): number {
  const leftPath = left.webkitRelativePath || left.name;
  const rightPath = right.webkitRelativePath || right.name;

  return leftPath.localeCompare(rightPath, undefined, {
    numeric: true,
    sensitivity: "base",
  });
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

function getSelectElement<T extends HTMLSelectElement>(id: string): T {
  return getElement<T>(id);
}
