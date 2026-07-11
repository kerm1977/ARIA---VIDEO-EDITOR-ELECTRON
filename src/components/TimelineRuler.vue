<template>
  <div class="timeline-header">
    <div class="time-ruler" @mousedown="onMouseDown">
      <div v-for="mark in marks" :key="mark.position" class="time-mark" :class="{ 'major': mark.major, 'minor': !mark.major }" :style="{ left: mark.position + '%' }">
        <span v-if="mark.major" class="time-label">{{ formatTime(mark.time) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTime } from '../utils/video'

const props = defineProps<{ marks: { time: number; position: number; major: boolean }[]; pixelsPerSecond?: number }>()
const emit = defineEmits<{ 'start-drag': [e: MouseEvent] }>()

function onMouseDown(e: MouseEvent) {
  emit('start-drag', e)
}
</script>

<style scoped>
.timeline-header { position: sticky; top: 0; background: #1a1a1a; z-index: 10; border-bottom: 1px solid #333; display: flex; align-items: center }
.time-ruler { flex: 1; height: 30px; position: relative; background: #0d0d0d; overflow: hidden; cursor: pointer }
.time-mark { position: absolute; top: 0; transform: translateX(-50%) }
.time-mark.major { border-left: 1px solid #666; height: 100% }
.time-mark.minor { border-left: 1px solid #333; height: 50% }
.time-label { font-size: 0.75rem; color: #888; padding: 0.5rem }
</style>
