import type {
  CanvasSpriteRenderer,
  DrawSpriteOptions,
  SpriteSheet,
} from "../types.js";

export function createCanvasSpriteRenderer(): CanvasSpriteRenderer {
  return {
    draw(
      context: CanvasRenderingContext2D,
      spriteSheet: SpriteSheet,
      options: DrawSpriteOptions,
    ) {
      const frame = spriteSheet.getFrameRect(options.frameIndex);
      const scale = options.scale ?? 1;
      const destinationWidth = options.destinationWidth ?? frame.width * scale;
      const destinationHeight =
        options.destinationHeight ?? frame.height * scale;

      context.drawImage(
        spriteSheet.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        options.position.x,
        options.position.y,
        destinationWidth,
        destinationHeight,
      );
    },
  };
}
