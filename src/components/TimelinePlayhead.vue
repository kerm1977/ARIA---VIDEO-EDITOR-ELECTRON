<template>
  <div class="playhead" :style="{ left: playheadPosition }">
    <div class="playhead-line"></div>
    <div class="playhead-knob" @mousedown="emit('start-drag')"></div>
    <div class="playhead-handle" @mousedown="emit('start-drag')"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PLAYHEAD_CONFIG } from '../config/playhead.config'

const props = defineProps<{ position: number }>()
const emit = defineEmits<{ 'start-drag': [] }>()

// CRITICAL: Use protected configuration for playhead positioning
const playheadPosition = computed(() => PLAYHEAD_CONFIG.getLeftPosition(props.position))
</script>

<style scoped>
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; z-index: 20; transform: translateX(-50%); will-change: left; transition: left 0.08s linear; pointer-events: none }
.playhead-line { width: 100%; height: 100%; background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.7); pointer-events: none }
.playhead-knob { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #ef4444; filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.7)); pointer-events: auto; cursor: ew-resize }
.playhead-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ef4444; border-radius: 50%; cursor: grab; opacity: 0; transition: opacity 0.2s; border: 2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.7); pointer-events: auto }
.playhead:hover .playhead-handle { opacity: 1 }
.playhead-handle:active { cursor: grabbing }
</style>
