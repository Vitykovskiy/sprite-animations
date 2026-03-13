import type {
  AnimationFrameSource,
  CanvasSpriteRenderer,
  DrawSpriteOptions,
} from "../types.js";

export function createCanvasSpriteRenderer(): CanvasSpriteRenderer {
  return {
    draw(
      context: CanvasRenderingContext2D,
      source: AnimationFrameSource,
      options: DrawSpriteOptions,
    ) {
      const frame = source.getFrame(options.frameIndex);
      const scale = options.scale ?? 1;
      const destinationWidth = options.destinationWidth ?? frame.width * scale;
      const destinationHeight =
        options.destinationHeight ?? frame.height * scale;

      context.drawImage(
        frame.image,
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
