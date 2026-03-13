import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";

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

export type AssetMode = "sprite-sheet" | "frame-sequence";

export interface PlaygroundConfig {
  assetType: AssetMode;
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

export function usePlaygroundRuntime() {
  const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
  const assetFileInputRef = ref<HTMLInputElement | null>(null);

  const assetMode = ref<AssetMode>("sprite-sheet");
  const assetStatus = ref("No asset loaded");
  const assetMeta = ref("Select a local image.");
  const previewMessage = ref("Select an image.");
  const currentFrame = ref("0");
  const playbackState = ref("idle");

  const config = reactive({
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    totalFrames: "",
    fps: "12",
    duration: "",
    loop: true,
    positionX: 160,
    positionY: 120,
    scale: 2,
    gridOpacity: 0.4,
    canvasWidth: 640,
    canvasHeight: 360,
  });

  const loadedImage = shallowRef<LoadedSpriteSheetImage | null>(null);
  const loadedFrames = shallowRef<LoadedFrameImage[]>([]);
  const spriteSheet = shallowRef<SpriteSheet | null>(null);
  const frameSequence = shallowRef<FrameSequence | null>(null);
  const animationSource = shallowRef<AnimationFrameSource | null>(null);
  const player = shallowRef<AnimationPlayer | null>(null);

  let previousTimestamp = 0;
  let activeObjectUrls: string[] = [];
  let animationFrameId = 0;

  const isFrameSequenceMode = computed(
    () => assetMode.value === "frame-sequence",
  );
  const assetPickerLabel = computed(() =>
    isFrameSequenceMode.value ? "Select folder" : "Select image",
  );
  const gridSectionDisabled = computed(() => isFrameSequenceMode.value);
  const serializedConfig = computed(() =>
    JSON.stringify(readConfig(), null, 2),
  );

  onMounted(() => {
    syncAssetInputAttributes();
    syncCanvasSize();
    updateAssetStatus();
    syncRuntime({ autoplay: false });
    animationFrameId = window.requestAnimationFrame(tick);
  });

  onBeforeUnmount(() => {
    releaseActiveObjectUrls();

    if (animationFrameId !== 0) {
      window.cancelAnimationFrame(animationFrameId);
    }
  });

  watch(assetMode, () => {
    resetLoadedAssets();

    if (assetFileInputRef.value) {
      assetFileInputRef.value.value = "";
    }

    syncAssetInputAttributes();
    updateAssetStatus();
    previewMessage.value = isFrameSequenceMode.value
      ? "Select a folder."
      : "Select an image.";
    syncRuntime({ autoplay: false });
  });

  watch(
    () => [
      config.frameWidth,
      config.frameHeight,
      config.columns,
      config.rows,
      config.totalFrames,
      config.fps,
      config.duration,
      config.loop,
      config.positionX,
      config.positionY,
      config.scale,
      config.gridOpacity,
      config.canvasWidth,
      config.canvasHeight,
    ],
    () => {
      syncCanvasSize();
      syncRuntime({ autoplay: false });
    },
  );

  watch(previewCanvasRef, () => {
    syncCanvasSize();
    drawPreviewFrame();
  });

  async function handleAssetSelection(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);

    if (files.length === 0) {
      resetLoadedAssets();
      updateAssetStatus();
      drawPreviewFrame();
      return;
    }

    releaseActiveObjectUrls();

    try {
      if (isFrameSequenceMode.value) {
        const sortedFiles = [...files].sort(compareFrameFiles);
        activeObjectUrls = sortedFiles.map((file) => URL.createObjectURL(file));
        loadedFrames.value = await loadFrameSequence(activeObjectUrls);
        loadedImage.value = null;
        previewMessage.value = "Frames loaded.";
        updateAssetStatus(`${loadedFrames.value.length} frames`);
      } else {
        const [file] = files;

        if (!file) {
          throw new Error("No image selected.");
        }

        const objectUrl = URL.createObjectURL(file);
        activeObjectUrls = [objectUrl];
        loadedImage.value = await loadSpriteSheetImage(objectUrl);
        loadedFrames.value = [];
        previewMessage.value = "Image loaded.";
        updateAssetStatus(file.name);
      }

      syncRuntime({ autoplay: true });
    } catch (error) {
      resetLoadedAssets();
      const message =
        error instanceof Error ? error.message : "Failed to load file.";
      assetStatus.value = "Load failed";
      assetMeta.value = message;
      previewMessage.value = message;
      drawPreviewFrame();
    }
  }

  function play(): void {
    player.value?.play();
  }

  function pause(): void {
    player.value?.pause();
    updatePlaybackMetrics();
  }

  function stop(): void {
    player.value?.stop();
    updatePlaybackMetrics();
    drawPreviewFrame();
  }

  async function copyConfigToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(serializedConfig.value);
      previewMessage.value = "JSON copied.";
    } catch {
      previewMessage.value = "Copy failed.";
    }
  }

  function saveConfigToFile(): void {
    const blob = new Blob([serializedConfig.value], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sprite-animation.config.json";
    anchor.click();
    URL.revokeObjectURL(url);
    previewMessage.value = "JSON saved.";
  }

  function syncRuntime(options: { autoplay: boolean }): void {
    syncCanvasSize();

    if (!hasLoadedAsset()) {
      animationSource.value = null;
      player.value = null;
      updatePlaybackMetrics();
      drawPreviewFrame();
      return;
    }

    try {
      const runtimeConfig = readConfig();

      if (isFrameSequenceMode.value) {
        frameSequence.value = createFrameSequence({
          frames: loadedFrames.value.map((frame) => frame.image),
        });
        spriteSheet.value = null;
        animationSource.value = frameSequence.value;
      } else {
        if (!loadedImage.value) {
          throw new Error("No sprite sheet image loaded.");
        }

        spriteSheet.value = createSpriteSheet({
          image: loadedImage.value.image,
          grid: {
            frameWidth: runtimeConfig.frameWidth,
            frameHeight: runtimeConfig.frameHeight,
            columns: runtimeConfig.columns,
            rows: runtimeConfig.rows,
            ...(runtimeConfig.totalFrames === undefined
              ? {}
              : { totalFrames: runtimeConfig.totalFrames }),
          },
        });
        frameSequence.value = null;
        animationSource.value = spriteSheet.value;
      }

      if (!animationSource.value) {
        throw new Error("No animation source available.");
      }

      player.value = createAnimationPlayer({
        totalFrames: animationSource.value.getFrameCount(),
        ...(runtimeConfig.fps === undefined ? {} : { fps: runtimeConfig.fps }),
        ...(runtimeConfig.duration === undefined
          ? {}
          : { duration: runtimeConfig.duration }),
        loop: runtimeConfig.loop,
      });

      if (options.autoplay) {
        player.value.play();
      }

      updatePlaybackMetrics();
      drawPreviewFrame();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid configuration.";
      previewMessage.value = message;
      updatePlaybackMetrics();
      drawPreviewFrame();
    }
  }

  function tick(timestamp: number): void {
    const deltaMs = previousTimestamp === 0 ? 0 : timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    if (player.value) {
      player.value.update(deltaMs);
      updatePlaybackMetrics();
      drawPreviewFrame();
    } else {
      drawPreviewFrame();
    }

    animationFrameId = window.requestAnimationFrame(tick);
  }

  function drawPreviewFrame(): void {
    const canvas = previewCanvasRef.value;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Playground requires a 2D canvas context.");
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawCanvasGrid(context, canvas, readGridOpacity(config.gridOpacity, 0.4));

    if (!animationSource.value || !player.value) {
      drawPlaceholder(context, canvas);
      return;
    }

    const runtimeConfig = readConfig();
    const snapshot = player.value.getSnapshot();

    renderer.draw(context, animationSource.value, {
      frameIndex: snapshot.frameIndex,
      position: runtimeConfig.position,
      scale: runtimeConfig.scale,
    });
  }

  function drawCanvasGrid(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    visibility: number,
  ): void {
    const alpha = Math.max(0, Math.min(1, visibility));
    context.save();
    context.strokeStyle = `rgba(26, 26, 26, ${alpha * 0.12})`;
    context.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += 32) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, canvas.height);
      context.stroke();
    }

    for (let y = 0; y < canvas.height; y += 32) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(canvas.width, y + 0.5);
      context.stroke();
    }

    context.restore();
  }

  function drawPlaceholder(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    context.save();
    context.fillStyle = "rgba(26, 26, 26, 0.56)";
    context.textAlign = "center";
    context.font = '500 16px "Aptos", "Segoe UI", sans-serif';
    context.fillText(
      isFrameSequenceMode.value ? "Select a folder." : "Select an image.",
      canvas.width / 2,
      canvas.height / 2,
    );
    context.restore();
  }

  function updateAssetStatus(fileName?: string): void {
    if (!hasLoadedAsset()) {
      assetStatus.value = "No asset loaded";
      assetMeta.value = isFrameSequenceMode.value
        ? "Select a folder with frames."
        : "Select a local image.";
      return;
    }

    assetStatus.value = fileName ?? "Asset loaded";

    if (isFrameSequenceMode.value) {
      const firstFrame = loadedFrames.value[0];
      assetMeta.value = firstFrame
        ? `${loadedFrames.value.length} frames, first ${firstFrame.width} x ${firstFrame.height} px`
        : `${loadedFrames.value.length} frames`;
      return;
    }

    assetMeta.value = loadedImage.value
      ? `${loadedImage.value.width} x ${loadedImage.value.height} px`
      : "Select a local image.";
  }

  function updatePlaybackMetrics(): void {
    const snapshot = player.value?.getSnapshot();
    currentFrame.value = String(snapshot?.frameIndex ?? 0);
    playbackState.value = snapshot?.playbackState ?? "idle";
  }

  function syncCanvasSize(): void {
    const canvas = previewCanvasRef.value;

    if (!canvas) {
      return;
    }

    canvas.width = readPositiveInteger(config.canvasWidth, 640);
    canvas.height = readPositiveInteger(config.canvasHeight, 360);
  }

  function syncAssetInputAttributes(): void {
    const input = assetFileInputRef.value;

    if (!input) {
      return;
    }

    input.multiple = isFrameSequenceMode.value;

    if (isFrameSequenceMode.value) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    } else {
      input.removeAttribute("webkitdirectory");
      input.removeAttribute("directory");
    }
  }

  function readConfig(): PlaygroundConfig {
    return {
      assetType: assetMode.value,
      frameWidth: readPositiveInteger(config.frameWidth, 64),
      frameHeight: readPositiveInteger(config.frameHeight, 64),
      columns: readPositiveInteger(config.columns, 4),
      rows: readPositiveInteger(config.rows, 4),
      totalFrames: readOptionalPositiveInteger(config.totalFrames),
      fps: readOptionalPositiveNumber(config.fps),
      duration: readOptionalNonNegativeNumber(config.duration),
      loop: config.loop,
      position: {
        x: readNumber(config.positionX, 160),
        y: readNumber(config.positionY, 120),
      },
      scale: readPositiveNumber(config.scale, 2),
      canvas: {
        width: readPositiveInteger(config.canvasWidth, 640),
        height: readPositiveInteger(config.canvasHeight, 360),
      },
    };
  }

  function resetLoadedAssets(): void {
    loadedImage.value = null;
    loadedFrames.value = [];
    spriteSheet.value = null;
    frameSequence.value = null;
    animationSource.value = null;
    player.value = null;
    releaseActiveObjectUrls();
    updatePlaybackMetrics();
  }

  function releaseActiveObjectUrls(): void {
    activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrls = [];
  }

  function hasLoadedAsset(): boolean {
    return loadedImage.value !== null || loadedFrames.value.length > 0;
  }

  return {
    assetFileInputRef,
    assetMeta,
    assetMode,
    assetPickerLabel,
    assetStatus,
    config,
    copyConfigToClipboard,
    currentFrame,
    gridSectionDisabled,
    handleAssetSelection,
    isFrameSequenceMode,
    pause,
    play,
    playbackState,
    previewCanvasRef,
    previewMessage,
    saveConfigToFile,
    serializedConfig,
    stop,
  };
}

function readNumber(value: number | string, fallback: number): number {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
}

function readPositiveInteger(value: number | string, fallback: number): number {
  const normalizedValue = Number(value);
  return Number.isInteger(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : fallback;
}

function readPositiveNumber(value: number | string, fallback: number): number {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : fallback;
}

function readOptionalPositiveInteger(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isInteger(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : undefined;
}

function readOptionalPositiveNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : undefined;
}

function readOptionalNonNegativeNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) && normalizedValue >= 0
    ? normalizedValue
    : undefined;
}

function readGridOpacity(value: number | string, fallback: number): number {
  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, normalizedValue));
}

function compareFrameFiles(left: File, right: File): number {
  const leftPath = left.webkitRelativePath || left.name;
  const rightPath = right.webkitRelativePath || right.name;

  return leftPath.localeCompare(rightPath, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
