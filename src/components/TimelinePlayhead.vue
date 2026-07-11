<template>
  <div class="playhead" :style="{ left: position + '%' }" @mousedown="emit('start-drag')">
    <div class="playhead-line"></div>
    <div class="playhead-knob"></div>
    <div class="playhead-handle"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ position: number }>()
const emit = defineEmits<{ 'start-drag': [] }>()
</script>

<style scoped>
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; z-index: 20; cursor: ew-resize; transform: translateX(-50%); will-change: left; transition: left 0.08s linear }
.playhead-line { width: 100%; height: 100%; background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.7) }
.playhead-knob { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #ef4444; filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.7)) }
.playhead-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ef4444; border-radius: 50%; cursor: grab; opacity: 0; transition: opacity 0.2s; border: 2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.7) }
.playhead:hover .playhead-handle { opacity: 1 }
.playhead-handle:active { cursor: grabbing }
</style>
