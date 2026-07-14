<template>
  <div class="clip" :class="{ 'audio-clip': props.track.type === 'audio', 'selected': props.selected }" :style="clipStyle" @mousedown.stop="onMouseDown" @contextmenu.prevent.stop="onContextMenu">
    <div class="clip-content">
      <span class="clip-name">{{ clipName }}</span>
      <span class="clip-duration">{{ formatTime(props.clip.end_time - props.clip.start_time) }}</span>
    </div>
    <div class="clip-handles"><div class="handle handle-left"></div><div class="handle handle-right"></div></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime, getClipStyle, getClipName } from '../utils/video'
import type { TimelineTrack, VideoClip } from '../stores/project'

const props = defineProps<{
  clip: VideoClip
  track: TimelineTrack
  duration: number
  selected: boolean
  onMouseDown: (e: MouseEvent, clip: VideoClip, trackId: string) => void
  onContextMenu: (e: MouseEvent, clip: VideoClip) => void
}>()

const clipStyle = computed(() => getClipStyle(props.clip, props.duration))
const clipName = computed(() => getClipName(props.clip))

function onMouseDown(e: MouseEvent) {
  props.onMouseDown(e, props.clip, props.track.id)
}

function onContextMenu(e: MouseEvent) {
  props.onContextMenu(e, props.clip)
}
</script>

<style scoped>
.clip { position: absolute; top: 8px; height: 44px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 6px; cursor: grab; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s }
.clip:active { cursor: grabbing }
.audio-clip { background: linear-gradient(135deg, #10b981 0%, #059669 100%) }
.clip:hover { transform: scaleY(1.05); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) }
.audio-clip:hover { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) }
.clip.selected { outline: 2px solid #fff; outline-offset: -2px; z-index: 5 }
.clip-content { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; pointer-events: none }
.clip-name { font-size: 0.75rem; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.clip-duration { font-size: 0.7rem; color: rgba(255, 255, 255, 0.7) }
.clip-handles { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none }
.handle { position: absolute; top: 0; bottom: 0; width: 12px; background: rgba(255, 255, 255, 0.2); cursor: ew-resize; pointer-events: auto; transition: background 0.2s }
.handle:hover { background: rgba(255, 255, 255, 0.4) }
.handle-left { left: 0; border-radius: 6px 0 0 6px }
.handle-right { right: 0; border-radius: 0 6px 6px 0 }
</style>
