import type {
  LoadedSpriteSheetImage,
  LoadSpriteSheetImageOptions,
  SpriteSheetImageSource,
} from "../types.js";

export async function loadSpriteSheetImage(
  source: SpriteSheetImageSource,
  options: LoadSpriteSheetImageOptions = {},
): Promise<LoadedSpriteSheetImage> {
  if (typeof source === "string") {
    return loadImageFromUrl(source, options);
  }

  if (isImageBitmap(source)) {
    return {
      image: source,
      width: source.width,
      height: source.height,
    };
  }

  await waitForImageElement(source);

  return {
    image: source,
    width: source.naturalWidth,
    height: source.naturalHeight,
  };
}

async function loadImageFromUrl(
  url: string,
  options: LoadSpriteSheetImageOptions,
): Promise<LoadedSpriteSheetImage> {
  const image = new Image();

  if (options.crossOrigin !== undefined) {
    image.crossOrigin = options.crossOrigin;
  }

  image.src = url;

  await waitForImageElement(image);

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

function waitForImageElement(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Failed to load sprite sheet image."));
    };

    const cleanup = () => {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };

    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
  });
}

function isImageBitmap(value: SpriteSheetImageSource): value is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap;
}
