<script setup lang="ts">
import { usePlaygroundRuntime } from "./usePlaygroundRuntime";

const {
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
  pause,
  play,
  playbackState,
  previewCanvasRef,
  previewMessage,
  saveConfigToFile,
  serializedConfig,
  stop,
} = usePlaygroundRuntime();
</script>

<template>
  <div class="playground-shell">
    <aside class="control-panel">
      <div class="panel-brand">
        <p class="brand-mark">Sprite Animations</p>
      </div>

      <section class="panel-section">
        <h2>Asset</h2>
        <label class="field">
          <span>Mode</span>
          <select v-model="assetMode">
            <option value="sprite-sheet">Sprite sheet</option>
            <option value="frame-sequence">Frame sequence</option>
          </select>
        </label>
        <label class="field">
          <span>File</span>
          <div class="upload-field">
            <span class="upload-icon" aria-hidden="true"></span>
            <span>{{ assetPickerLabel }}</span>
            <input
              ref="assetFileInputRef"
              type="file"
              accept="image/*"
              @change="handleAssetSelection"
            />
          </div>
        </label>
        <div class="status-inline">
          <span class="status-label">Status</span>
          <strong>{{ assetStatus }}</strong>
        </div>
        <div class="asset-meta-row">
          <span>{{ assetMeta }}</span>
        </div>
      </section>

      <section
        class="panel-section grid-two"
        :class="{ 'is-disabled': gridSectionDisabled }"
      >
        <h2>Grid</h2>
        <label class="field">
          <span>Frame width</span>
          <input
            v-model.number="config.frameWidth"
            type="number"
            min="1"
            :disabled="gridSectionDisabled"
          />
        </label>
        <label class="field">
          <span>Frame height</span>
          <input
            v-model.number="config.frameHeight"
            type="number"
            min="1"
            :disabled="gridSectionDisabled"
          />
        </label>
        <label class="field">
          <span>Columns</span>
          <input
            v-model.number="config.columns"
            type="number"
            min="1"
            :disabled="gridSectionDisabled"
          />
        </label>
        <label class="field">
          <span>Rows</span>
          <input
            v-model.number="config.rows"
            type="number"
            min="1"
            :disabled="gridSectionDisabled"
          />
        </label>
        <label class="field field-full">
          <span>Total frames</span>
          <input
            v-model="config.totalFrames"
            type="number"
            min="1"
            placeholder="defaults to columns x rows"
            :disabled="gridSectionDisabled"
          />
        </label>
      </section>

      <section class="panel-section grid-two">
        <h2>Timing</h2>
        <label class="field">
          <span>FPS</span>
          <input v-model="config.fps" type="number" min="1" />
        </label>
        <label class="field">
          <span>Duration (ms)</span>
          <input
            v-model="config.duration"
            type="number"
            min="0"
            placeholder="optional"
          />
        </label>
        <label class="field field-checkbox field-full">
          <input v-model="config.loop" type="checkbox" />
          <span>Loop animation</span>
        </label>
      </section>

      <section class="panel-section grid-two">
        <h2>Transform</h2>
        <label class="field">
          <span>Position X</span>
          <input v-model.number="config.positionX" type="number" />
        </label>
        <label class="field">
          <span>Position Y</span>
          <input v-model.number="config.positionY" type="number" />
        </label>
        <label class="field">
          <span>Scale</span>
          <input v-model.number="config.scale" type="number" min="0.1" step="0.1" />
        </label>
        <label class="field">
          <span>Grid opacity</span>
          <input
            v-model.number="config.gridOpacity"
            type="number"
            min="0"
            max="1"
            step="0.1"
          />
        </label>
      </section>

      <section class="panel-section grid-two">
        <h2>Canvas</h2>
        <label class="field">
          <span>Canvas width</span>
          <input v-model.number="config.canvasWidth" type="number" min="64" />
        </label>
        <label class="field">
          <span>Canvas height</span>
          <input v-model.number="config.canvasHeight" type="number" min="64" />
        </label>
      </section>

      <section class="panel-section">
        <h2>Playback</h2>
        <div class="button-row">
          <button type="button" class="button-primary" @click="play">Play</button>
          <button type="button" @click="pause">Pause</button>
          <button type="button" @click="stop">Stop</button>
        </div>
        <div class="status-grid">
          <div>
            <span class="metric-label">Frame</span>
            <strong>{{ currentFrame }}</strong>
          </div>
          <div>
            <span class="metric-label">State</span>
            <strong>{{ playbackState }}</strong>
          </div>
        </div>
      </section>

      <section class="panel-section">
        <h2>Config</h2>
        <div class="button-row">
          <button type="button" @click="saveConfigToFile">Save JSON</button>
          <button type="button" @click="copyConfigToClipboard">Copy JSON</button>
        </div>
        <textarea
          :value="serializedConfig"
          rows="10"
          spellcheck="false"
          readonly
        />
      </section>
    </aside>

    <main class="preview-panel">
      <div class="preview-header">
        <div>
          <h1>Playground</h1>
        </div>
        <p class="preview-message">{{ previewMessage }}</p>
      </div>
      <div class="canvas-stage">
        <canvas
          ref="previewCanvasRef"
          class="preview-canvas"
          width="640"
          height="360"
        ></canvas>
      </div>
    </main>
  </div>
</template>
