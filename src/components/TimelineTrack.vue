<template>
  <div class="track" :class="{ 'audio-track': props.track.type === 'audio' }">
    <div class="track-header">
      <span class="track-name">{{ props.track.name }}</span>
      <button class="track-btn" @click="emit('add-clip', props.track.id)"><Plus class="w-4 h-4" /></button>
    </div>
    <div class="track-lane" @mousedown="onLaneMouseDown">
      <TimelineClip v-for="clip in props.track.clips" :key="clip.id" :clip="clip as VideoClip" :track="props.track" :duration="props.duration" :selected="props.selectedIds.has(clip.id)" :onMouseDown="props.onClipMouseDown" :onContextMenu="props.onClipContextMenu" />
      <div v-if="props.boxSelection?.visible && props.boxSelection?.trackId === props.track.id" class="selection-box" :style="props.selectionBoxStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import TimelineClip from './TimelineClip.vue'
import type { TimelineTrack, VideoClip } from '../stores/project'

const props = defineProps<{
  track: TimelineTrack
  duration: number
  selectedIds: Set<string>
  boxSelection?: { visible: boolean; trackId: string; currentX: number; startX: number }
  selectionBoxStyle?: { left: string; width: string }
  onClipMouseDown: (e: MouseEvent, clip: VideoClip, trackId: string) => void
  onClipContextMenu: (e: MouseEvent, clip: VideoClip) => void
  onLaneMouseDown: (e: MouseEvent, trackId: string) => void
}>()

const emit = defineEmits<{ 'add-clip': [trackId: string] }>()

function onLaneMouseDown(e: MouseEvent) {
  if (e.target !== e.currentTarget) return
  props.onLaneMouseDown(e, props.track.id)
}
</script>

<style scoped>
.track { margin-bottom: 0.5rem }
.track-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; background: #0d0d0d; border-bottom: 1px solid #333 }
.track-name { font-size: 0.875rem; font-weight: 500; color: #ccc }
.track-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #333; border: none; border-radius: 4px; color: white; cursor: pointer; transition: background 0.2s }
.track-btn:hover { background: #6366f1 }
.track-lane { position: relative; height: 60px; background: #151515; border-bottom: 1px solid #333; overflow: hidden }
.audio-track .track-lane { background: #0a0a0a }
.selection-box { position: absolute; top: 0; height: 100%; border: 1px dashed rgba(255,255,255,0.6); background: rgba(99, 102, 241, 0.25); z-index: 6; pointer-events: none; box-sizing: border-box }
</style>
