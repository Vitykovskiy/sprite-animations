<script setup lang="ts">
import PlaygroundPreview from "./components/PlaygroundPreview.vue";
import PlaygroundSidebar from "./components/PlaygroundSidebar.vue";
import {
  createPlaygroundRuntime,
  providePlaygroundRuntime,
} from "./usePlaygroundRuntime";

providePlaygroundRuntime(createPlaygroundRuntime());
</script>

<template>
  <div class="playground-shell">
    <PlaygroundSidebar />
    <PlaygroundPreview />
  </div>
</template>
