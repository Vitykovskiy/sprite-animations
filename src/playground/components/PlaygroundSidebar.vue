<script setup lang="ts">
import { usePlaygroundRuntime } from "../usePlaygroundRuntime";

const {
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
  isFrameSequenceMode,
  loadConfigFromFile,
  pause,
  play,
  playbackState,
  saveConfigToFile,
  serializedConfig,
  stop,
  timingForm,
  transformForm,
} = usePlaygroundRuntime();

function handleAssetModeChange(event: Event): void {
  const select = event.target as HTMLSelectElement | null;

  if (!select) {
    return;
  }

  assetMode.value = select.value as typeof assetMode.value;
}

function handleAssetInputChange(event: Event): void {
  const input = event.target as HTMLInputElement | null;
  void handleAssetSelection(Array.from(input?.files ?? []));
}

function handleBackgroundModeChange(event: Event): void {
  const select = event.target as HTMLSelectElement | null;

  if (!select) {
    return;
  }

  backgroundForm.mode = select.value as typeof backgroundForm.mode;
}

function handleBackgroundImageInputChange(event: Event): void {
  const input = event.target as HTMLInputElement | null;
  void handleBackgroundImageSelection(Array.from(input?.files ?? []));
}

function handleConfigInputChange(event: Event): void {
  const input = event.target as HTMLInputElement | null;
  void loadConfigFromFile(Array.from(input?.files ?? []));
}
</script>

<template>
  <aside class="control-panel">
    <div class="panel-brand">
      <p class="brand-mark">Sprite Animations</p>
    </div>

    <section class="panel-section">
      <h2>Asset</h2>
      <label class="field">
        <span>Mode</span>
        <select :value="assetMode" @change="handleAssetModeChange">
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
            :key="assetMode"
            type="file"
            accept="image/*"
            :multiple="isFrameSequenceMode"
            :webkitdirectory="isFrameSequenceMode ? '' : undefined"
            :directory="isFrameSequenceMode ? '' : undefined"
            @change="handleAssetInputChange"
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
          v-model.number="gridForm.frameWidth"
          type="number"
          min="1"
          :disabled="gridSectionDisabled"
        />
      </label>
      <label class="field">
        <span>Frame height</span>
        <input
          v-model.number="gridForm.frameHeight"
          type="number"
          min="1"
          :disabled="gridSectionDisabled"
        />
      </label>
      <label class="field">
        <span>Columns</span>
        <input
          v-model.number="gridForm.columns"
          type="number"
          min="1"
          :disabled="gridSectionDisabled"
        />
      </label>
      <label class="field">
        <span>Rows</span>
        <input
          v-model.number="gridForm.rows"
          type="number"
          min="1"
          :disabled="gridSectionDisabled"
        />
      </label>
      <label class="field field-full">
        <span>Total frames</span>
        <input
          v-model="gridForm.totalFrames"
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
        <input v-model="timingForm.fps" type="number" min="1" />
      </label>
      <label class="field">
        <span>Duration (ms)</span>
        <input
          v-model="timingForm.duration"
          type="number"
          min="0"
          placeholder="optional"
        />
      </label>
      <label class="field field-checkbox field-full">
        <input v-model="timingForm.loop" type="checkbox" />
        <span>Loop animation</span>
      </label>
    </section>

    <section class="panel-section grid-two">
      <h2>Transform</h2>
      <label class="field">
        <span>Position X</span>
        <input v-model.number="transformForm.positionX" type="number" />
      </label>
      <label class="field">
        <span>Position Y</span>
        <input v-model.number="transformForm.positionY" type="number" />
      </label>
      <label class="field">
        <span>Scale</span>
        <input
          v-model.number="transformForm.scale"
          type="number"
          min="0.1"
          step="0.1"
        />
      </label>
      <label class="field">
        <span>Grid opacity</span>
        <input
          v-model.number="transformForm.gridOpacity"
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
        <input v-model.number="canvasForm.canvasWidth" type="number" min="64" />
      </label>
      <label class="field">
        <span>Canvas height</span>
        <input
          v-model.number="canvasForm.canvasHeight"
          type="number"
          min="64"
        />
      </label>
    </section>

    <section class="panel-section grid-two">
      <h2>Background</h2>
      <label class="field field-full">
        <span>Source</span>
        <select :value="backgroundMode" @change="handleBackgroundModeChange">
          <option value="palette">Palette</option>
          <option value="image">Image</option>
        </select>
      </label>
      <label class="field">
        <span>Palette</span>
        <select v-model="backgroundForm.palette">
          <option value="paper-white">Paper White</option>
          <option value="ink-black">Ink Black</option>
          <option value="chroma-green">Chroma Green</option>
          <option value="neutral-gray">Neutral Gray</option>
          <option value="sand">Sand</option>
        </select>
      </label>
      <label class="field">
        <span>Image mode</span>
        <select
          v-model="backgroundForm.imageFit"
          :disabled="backgroundImageFitDisabled"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="repeat">Repeat</option>
          <option value="stretch">Stretch</option>
        </select>
      </label>
      <label class="field field-full">
        <span>Background image</span>
        <div class="upload-field">
          <span class="upload-icon" aria-hidden="true"></span>
          <span>Select image</span>
          <input
            type="file"
            accept="image/*"
            @change="handleBackgroundImageInputChange"
          />
        </div>
      </label>
      <div class="status-inline field-full">
        <span class="status-label">Background</span>
        <strong>{{ backgroundStatus }}</strong>
      </div>
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
        <label class="button-upload">
          <span>Load JSON</span>
          <input
            type="file"
            accept="application/json,.json"
            @change="handleConfigInputChange"
          />
        </label>
      </div>
      <textarea
        :value="serializedConfig"
        rows="10"
        spellcheck="false"
        readonly
      />
    </section>
  </aside>
</template>
