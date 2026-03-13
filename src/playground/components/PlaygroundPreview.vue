<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { usePlaygroundRuntime } from "../usePlaygroundRuntime";

const { bindPreviewCanvasRef, previewMessage } = usePlaygroundRuntime();
const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  bindPreviewCanvasRef(canvasRef.value);
});

onBeforeUnmount(() => {
  bindPreviewCanvasRef(null);
});
</script>

<template>
  <main class="preview-panel">
    <div class="preview-header">
      <div>
        <h1>Playground</h1>
      </div>
      <p class="preview-message">{{ previewMessage }}</p>
    </div>
    <div class="canvas-stage">
      <canvas
        ref="canvasRef"
        class="preview-canvas"
        width="640"
        height="360"
      ></canvas>
    </div>
  </main>
</template>
