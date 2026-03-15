import {
  type ComputedRef,
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  shallowRef,
  watch,
  type InjectionKey,
  type Ref,
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
import type { PlaygroundConfig } from "./types/runtime";
import type {
  AssetMode,
  BackgroundImageFit,
  BackgroundPaletteId,
  BackgroundMode,
  PlaygroundBackgroundForm,
  PlaygroundCanvasForm,
  PlaygroundGridForm,
  PlaygroundTimingForm,
  PlaygroundTransformForm,
} from "./components/types";

const renderer = createCanvasSpriteRenderer();

const BACKGROUND_PALETTES: Record<BackgroundPaletteId, string> = {
  "paper-white": "#ffffff",
  "ink-black": "#050505",
  "chroma-green": "#00ff66",
  "neutral-gray": "#9ca3af",
  sand: "#d9c29c",
};

export interface PlaygroundRuntime {
  assetMeta: Ref<string>;
  assetMode: Ref<AssetMode>;
  assetPickerLabel: ComputedRef<string>;
  assetStatus: Ref<string>;
  backgroundForm: PlaygroundBackgroundForm;
  backgroundImageFitDisabled: ComputedRef<boolean>;
  backgroundMode: ComputedRef<BackgroundMode>;
  backgroundStatus: Ref<string>;
  bindPreviewCanvasRef: (element: HTMLCanvasElement | null) => void;
  canvasForm: PlaygroundCanvasForm;
  currentFrame: Ref<string>;
  gridForm: PlaygroundGridForm;
  gridSectionDisabled: ComputedRef<boolean>;
  handleAssetSelection: (files: File[]) => Promise<void>;
  handleBackgroundImageSelection: (files: File[]) => Promise<void>;
  loadConfigFromFile: (files: File[]) => Promise<void>;
  isFrameSequenceMode: ComputedRef<boolean>;
  pause: () => void;
  play: () => void;
  playbackState: Ref<string>;
  previewMessage: Ref<string>;
  saveConfigToFile: () => void;
  serializedConfig: ComputedRef<string>;
  stop: () => void;
  timingForm: PlaygroundTimingForm;
  transformForm: PlaygroundTransformForm;
}

const playgroundRuntimeKey: InjectionKey<PlaygroundRuntime> =
  Symbol("playgroundRuntime");

export function createPlaygroundRuntime(): PlaygroundRuntime {
  const previewCanvasRef = ref<HTMLCanvasElement | null>(null);

  const assetMode = ref<AssetMode>("sprite-sheet");
  const assetStatus = ref("No asset loaded");
  const assetMeta = ref("Select a local image.");
  const previewMessage = ref("Select an image.");
  const currentFrame = ref("0");
  const playbackState = ref("idle");
  const backgroundStatus = ref("Palette: Paper White");

  const gridForm = reactive<PlaygroundGridForm>({
    frameWidth: 64,
    frameHeight: 64,
    columns: 4,
    rows: 4,
    totalFrames: "",
  });

  const timingForm = reactive<PlaygroundTimingForm>({
    fps: "12",
    duration: "",
    loop: true,
  });

  const transformForm = reactive<PlaygroundTransformForm>({
    positionX: 160,
    positionY: 120,
    scale: 2,
    gridOpacity: 0.4,
  });

  const canvasForm = reactive<PlaygroundCanvasForm>({
    canvasWidth: 640,
    canvasHeight: 360,
  });

  const backgroundForm = reactive<PlaygroundBackgroundForm>({
    mode: "palette",
    palette: "paper-white",
    imageFit: "cover",
  });

  const loadedImage = shallowRef<LoadedSpriteSheetImage | null>(null);
  const loadedFrames = shallowRef<LoadedFrameImage[]>([]);
  const backgroundImage = shallowRef<HTMLImageElement | null>(null);
  const backgroundImageName = ref<string | null>(null);
  const spriteSheet = shallowRef<SpriteSheet | null>(null);
  const frameSequence = shallowRef<FrameSequence | null>(null);
  const animationSource = shallowRef<AnimationFrameSource | null>(null);
  const player = shallowRef<AnimationPlayer | null>(null);

  let previousTimestamp = 0;
  let activeObjectUrls: string[] = [];
  let activeBackgroundObjectUrl: string | null = null;
  let animationFrameId = 0;

  const isFrameSequenceMode = computed(
    () => assetMode.value === "frame-sequence",
  );
  const assetPickerLabel = computed(() =>
    isFrameSequenceMode.value ? "Select folder" : "Select image",
  );
  const gridSectionDisabled = computed(() => isFrameSequenceMode.value);
  const backgroundMode = computed(() => backgroundForm.mode);
  const backgroundImageFitDisabled = computed(
    () => backgroundForm.mode !== "image" || backgroundImage.value === null,
  );
  const serializedConfig = computed(() =>
    JSON.stringify(readConfig(), null, 2),
  );

  onMounted(() => {
    syncCanvasSize();
    updateAssetStatus();
    updateBackgroundStatus();
    syncRuntime({ autoplay: false });
    animationFrameId = window.requestAnimationFrame(tick);
  });

  onBeforeUnmount(() => {
    releaseActiveObjectUrls();
    releaseBackgroundObjectUrl();

    if (animationFrameId !== 0) {
      window.cancelAnimationFrame(animationFrameId);
    }
  });

  watch(assetMode, () => {
    resetLoadedAssets();
    updateAssetStatus();
    previewMessage.value = isFrameSequenceMode.value
      ? "Select a folder."
      : "Select an image.";
    syncRuntime({ autoplay: false });
  });

  watch(
    () => [
      gridForm.frameWidth,
      gridForm.frameHeight,
      gridForm.columns,
      gridForm.rows,
      gridForm.totalFrames,
      timingForm.fps,
      timingForm.duration,
      timingForm.loop,
      transformForm.positionX,
      transformForm.positionY,
      transformForm.scale,
      transformForm.gridOpacity,
      canvasForm.canvasWidth,
      canvasForm.canvasHeight,
    ],
    () => {
      syncCanvasSize();
      syncRuntime({ autoplay: false });
    },
  );

  watch(
    () => [
      backgroundForm.mode,
      backgroundForm.palette,
      backgroundForm.imageFit,
    ],
    () => {
      updateBackgroundStatus();
      drawPreviewFrame();
    },
  );

  watch(previewCanvasRef, () => {
    syncCanvasSize();
    drawPreviewFrame();
  });

  async function handleAssetSelection(files: File[]): Promise<void> {
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

  async function handleBackgroundImageSelection(files: File[]): Promise<void> {
    const [file] = files;

    if (!file) {
      releaseBackgroundObjectUrl();
      backgroundImage.value = null;
      backgroundImageName.value = null;
      if (backgroundForm.mode === "image") {
        backgroundForm.mode = "palette";
      }
      updateBackgroundStatus();
      drawPreviewFrame();
      return;
    }

    releaseBackgroundObjectUrl();

    try {
      const objectUrl = URL.createObjectURL(file);
      activeBackgroundObjectUrl = objectUrl;
      backgroundImage.value = await loadHtmlImage(objectUrl);
      backgroundImageName.value = file.name;
      backgroundForm.mode = "image";
      previewMessage.value = "Background image loaded.";
      updateBackgroundStatus();
      drawPreviewFrame();
    } catch (error) {
      backgroundImage.value = null;
      backgroundImageName.value = null;
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load background image.";
      backgroundStatus.value = "Background load failed";
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

  async function loadConfigFromFile(files: File[]): Promise<void> {
    const [file] = files;

    if (!file) {
      previewMessage.value = "No JSON selected.";
      return;
    }

    try {
      const config = parsePlaygroundConfig(await file.text());
      applyLoadedConfig(config);
      previewMessage.value = "JSON loaded.";
    } catch (error) {
      previewMessage.value =
        error instanceof Error ? error.message : "Failed to load JSON.";
    }
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
    drawPreviewBackground(context, canvas);
    drawCanvasGrid(
      context,
      canvas,
      readGridOpacity(transformForm.gridOpacity, 0.4),
    );

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

  function drawPreviewBackground(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    if (backgroundForm.mode === "image" && backgroundImage.value) {
      drawBackgroundImage(context, canvas, backgroundImage.value);
      return;
    }

    context.fillStyle = BACKGROUND_PALETTES[backgroundForm.palette];
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawBackgroundImage(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
  ): void {
    const fitMode = backgroundForm.imageFit;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (fitMode === "repeat") {
      const pattern = context.createPattern(image, "repeat");

      if (!pattern) {
        drawPaletteFallback(context, canvas);
        return;
      }

      context.save();
      context.fillStyle = pattern;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();
      return;
    }

    if (fitMode === "stretch") {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return;
    }

    const scale = readImageScale(
      fitMode,
      canvas.width,
      canvas.height,
      sourceWidth,
      sourceHeight,
    );
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    drawPaletteFallback(context, canvas);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  function drawPaletteFallback(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    context.fillStyle = BACKGROUND_PALETTES[backgroundForm.palette];
    context.fillRect(0, 0, canvas.width, canvas.height);
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

  function updateBackgroundStatus(): void {
    if (backgroundForm.mode === "image") {
      backgroundStatus.value = backgroundImage.value
        ? backgroundImageName.value
          ? `Image: ${backgroundImageName.value}`
          : "Image background active"
        : "No background image";
      return;
    }

    backgroundStatus.value = `Palette: ${formatBackgroundPaletteLabel(backgroundForm.palette)}`;
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

    canvas.width = readPositiveInteger(canvasForm.canvasWidth, 640);
    canvas.height = readPositiveInteger(canvasForm.canvasHeight, 360);
  }

  function bindPreviewCanvasRef(element: HTMLCanvasElement | null): void {
    previewCanvasRef.value = element;
  }

  function applyLoadedConfig(config: PlaygroundConfig): void {
    assetMode.value = config.assetType;
    gridForm.frameWidth = config.frameWidth;
    gridForm.frameHeight = config.frameHeight;
    gridForm.columns = config.columns;
    gridForm.rows = config.rows;
    gridForm.totalFrames =
      config.totalFrames === undefined ? "" : String(config.totalFrames);
    timingForm.fps = config.fps === undefined ? "" : String(config.fps);
    timingForm.duration =
      config.duration === undefined ? "" : String(config.duration);
    timingForm.loop = config.loop;
    transformForm.positionX = config.position.x;
    transformForm.positionY = config.position.y;
    transformForm.scale = config.scale;
    canvasForm.canvasWidth = config.canvas.width;
    canvasForm.canvasHeight = config.canvas.height;
  }

  function readConfig(): PlaygroundConfig {
    return {
      assetType: assetMode.value,
      frameWidth: readPositiveInteger(gridForm.frameWidth, 64),
      frameHeight: readPositiveInteger(gridForm.frameHeight, 64),
      columns: readPositiveInteger(gridForm.columns, 4),
      rows: readPositiveInteger(gridForm.rows, 4),
      totalFrames: readOptionalPositiveInteger(gridForm.totalFrames),
      fps: readOptionalPositiveNumber(timingForm.fps),
      duration: readOptionalNonNegativeNumber(timingForm.duration),
      loop: timingForm.loop,
      position: {
        x: readNumber(transformForm.positionX, 160),
        y: readNumber(transformForm.positionY, 120),
      },
      scale: readPositiveNumber(transformForm.scale, 2),
      canvas: {
        width: readPositiveInteger(canvasForm.canvasWidth, 640),
        height: readPositiveInteger(canvasForm.canvasHeight, 360),
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

  function releaseBackgroundObjectUrl(): void {
    if (!activeBackgroundObjectUrl) {
      return;
    }

    URL.revokeObjectURL(activeBackgroundObjectUrl);
    activeBackgroundObjectUrl = null;
  }

  function hasLoadedAsset(): boolean {
    return loadedImage.value !== null || loadedFrames.value.length > 0;
  }

  return {
    assetMeta,
    assetMode,
    assetPickerLabel,
    assetStatus,
    backgroundForm,
    backgroundImageFitDisabled,
    backgroundMode,
    backgroundStatus,
    canvasForm,
    currentFrame,
    gridForm,
    gridSectionDisabled,
    handleAssetSelection,
    handleBackgroundImageSelection,
    loadConfigFromFile,
    isFrameSequenceMode,
    pause,
    play,
    playbackState,
    bindPreviewCanvasRef,
    previewMessage,
    saveConfigToFile,
    serializedConfig,
    stop,
    timingForm,
    transformForm,
  };
}

export function providePlaygroundRuntime(runtime: PlaygroundRuntime): void {
  provide(playgroundRuntimeKey, runtime);
}

export function usePlaygroundRuntime(): PlaygroundRuntime {
  const runtime = inject(playgroundRuntimeKey);

  if (!runtime) {
    throw new Error("Playground runtime is not provided.");
  }

  return runtime;
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

function readOptionalPositiveInteger(
  value: number | string,
): number | undefined {
  if (isBlankValue(value)) {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isInteger(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : undefined;
}

function readOptionalPositiveNumber(
  value: number | string,
): number | undefined {
  if (isBlankValue(value)) {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) && normalizedValue > 0
    ? normalizedValue
    : undefined;
}

function readOptionalNonNegativeNumber(
  value: number | string,
): number | undefined {
  if (isBlankValue(value)) {
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

function isBlankValue(value: number | string): boolean {
  return typeof value === "string" && value.trim() === "";
}

function compareFrameFiles(left: File, right: File): number {
  const leftPath = left.webkitRelativePath || left.name;
  const rightPath = right.webkitRelativePath || right.name;

  return leftPath.localeCompare(rightPath, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function formatBackgroundPaletteLabel(value: BackgroundPaletteId): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readImageScale(
  fitMode: Exclude<BackgroundImageFit, "repeat" | "stretch">,
  targetWidth: number,
  targetHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): number {
  const widthRatio = targetWidth / sourceWidth;
  const heightRatio = targetHeight / sourceHeight;

  return fitMode === "cover"
    ? Math.max(widthRatio, heightRatio)
    : Math.min(widthRatio, heightRatio);
}

function loadHtmlImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = source;
  });
}

function parsePlaygroundConfig(source: string): PlaygroundConfig {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(source);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!isRecord(parsedValue)) {
    throw new Error("JSON config must be an object.");
  }

  const position = parsedValue.position;
  const canvas = parsedValue.canvas;

  if (!isRecord(position) || !isRecord(canvas)) {
    throw new Error("JSON config is missing position or canvas.");
  }

  return {
    assetType: readAssetMode(parsedValue.assetType),
    frameWidth: readRequiredPositiveInteger(
      parsedValue.frameWidth,
      "frameWidth",
    ),
    frameHeight: readRequiredPositiveInteger(
      parsedValue.frameHeight,
      "frameHeight",
    ),
    columns: readRequiredPositiveInteger(parsedValue.columns, "columns"),
    rows: readRequiredPositiveInteger(parsedValue.rows, "rows"),
    totalFrames: readOptionalPositiveIntegerFromUnknown(
      parsedValue.totalFrames,
    ),
    fps: readOptionalPositiveNumberFromUnknown(parsedValue.fps),
    duration: readOptionalNonNegativeNumberFromUnknown(parsedValue.duration),
    loop: readBoolean(parsedValue.loop, "loop"),
    position: {
      x: readRequiredNumber(position.x, "position.x"),
      y: readRequiredNumber(position.y, "position.y"),
    },
    scale: readRequiredPositiveNumber(parsedValue.scale, "scale"),
    canvas: {
      width: readRequiredPositiveInteger(canvas.width, "canvas.width"),
      height: readRequiredPositiveInteger(canvas.height, "canvas.height"),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readAssetMode(value: unknown): AssetMode {
  if (value === "sprite-sheet" || value === "frame-sequence") {
    return value;
  }

  throw new Error("JSON config contains unsupported assetType.");
}

function readRequiredNumber(value: unknown, fieldName: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error(`JSON config field "${fieldName}" must be a number.`);
}

function readRequiredPositiveNumber(value: unknown, fieldName: string): number {
  const normalizedValue = readRequiredNumber(value, fieldName);

  if (normalizedValue > 0) {
    return normalizedValue;
  }

  throw new Error(`JSON config field "${fieldName}" must be greater than 0.`);
}

function readRequiredPositiveInteger(
  value: unknown,
  fieldName: string,
): number {
  const normalizedValue = readRequiredNumber(value, fieldName);

  if (Number.isInteger(normalizedValue) && normalizedValue > 0) {
    return normalizedValue;
  }

  throw new Error(
    `JSON config field "${fieldName}" must be a positive integer.`,
  );
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throw new Error(`JSON config field "${fieldName}" must be a boolean.`);
}

function readOptionalPositiveIntegerFromUnknown(
  value: unknown,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  throw new Error(
    'JSON config field "totalFrames" must be a positive integer.',
  );
}

function readOptionalPositiveNumberFromUnknown(
  value: unknown,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  throw new Error('JSON config field "fps" must be greater than 0.');
}

function readOptionalNonNegativeNumberFromUnknown(
  value: unknown,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  throw new Error('JSON config field "duration" must be 0 or greater.');
}
