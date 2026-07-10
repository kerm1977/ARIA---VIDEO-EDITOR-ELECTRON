<template>
  <div class="timeline">
    <div class="timeline-header">
      <div class="time-ruler">
        <div v-for="mark in timeMarks" :key="mark.position" class="time-mark" :style="{ left: mark.position + '%' }">
          <span class="time-label">{{ formatTime(mark.time) }}</span>
        </div>
      </div>
    </div>
    <div class="tracks-container">
      <div v-for="track in tracks" :key="track.id" class="track" :class="{ 'audio-track': track.type === 'audio' }">
        <div class="track-header">
          <span class="track-name">{{ track.name }}</span>
          <button class="track-btn" @click="$emit('addClip', track.id)"><Plus class="w-4 h-4" /></button>
        </div>
        <div class="track-lane">
          <div v-for="clip in track.clips" :key="clip.id" class="clip" :class="{ 'audio-clip': track.type === 'audio' }" :style="getClipStyle(clip, duration)" @click="$emit('selectClip', clip)">
            <div class="clip-content">
              <span class="clip-name">{{ getClipName(clip) }}</span>
              <span class="clip-duration">{{ formatTime(clip.end_time - clip.start_time) }}</span>
            </div>
            <div class="clip-handles"><div class="handle handle-left"></div><div class="handle handle-right"></div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="playhead" :style="{ left: playheadPosition + '%' }" @mousedown="startDrag">
      <div class="playhead-line"></div>
      <div class="playhead-knob"></div>
      <div class="playhead-handle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { formatTime, getClipStyle, getClipName } from '../utils/video'
import type { TimelineTrack, VideoClip } from '../stores/project'

const props = defineProps<{ tracks: TimelineTrack[], duration: number, currentTime: number, isPlaying: boolean }>()
const emit = defineEmits<{ addClip: [trackId: string], selectClip: [clip: VideoClip | any], timeUpdate: [time: number], cutClip: [] }>()
const playheadPosition = ref(0)
const isDragging = ref(false)

const timeMarks = computed(() => {
  const marks = []
  const totalDuration = props.duration || 60
  // Adjust interval based on duration for better display
  const interval = totalDuration < 60 ? 5 : 10
  for (let i = 0; i <= totalDuration; i += interval) marks.push({ time: i, position: (i / totalDuration) * 100 })
  return marks
})

function startDrag() {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const timeline = document.querySelector('.timeline')
  if (!timeline) return
  const rect = timeline.getBoundingClientRect()
  const x = e.clientX - rect.left
  const totalDuration = props.duration || 60
  const newTime = (x / rect.width) * totalDuration
  playheadPosition.value = (newTime / totalDuration) * 100
  emit('timeUpdate', Math.max(0, Math.min(newTime, totalDuration)))
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function cutClip() { emit('cutClip') }

function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'KeyX') {
    e.preventDefault()
    cutClip()
  }
}

onMounted(() => { window.addEventListener('keydown', handleKeyDown) })
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

watch(() => props.currentTime, (time) => {
  if (!isDragging.value) {
    const totalDuration = Math.max(props.duration || 60, 60)
    playheadPosition.value = (time / totalDuration) * 100
  }
})
</script>

<style scoped>
.timeline { position: relative; background: #1a1a1a; border-top: 1px solid #333; height: 300px; overflow: hidden }
.timeline-header { position: sticky; top: 0; background: #1a1a1a; z-index: 10; border-bottom: 1px solid #333; display: flex; align-items: center }
.timeline-tools { display: flex; gap: 0.5rem; padding: 0.5rem; border-right: 1px solid #333 }
.tool-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #333; border: none; border-radius: 4px; color: white; cursor: pointer; transition: background 0.2s }
.tool-btn:hover { background: #6366f1 }
.time-ruler { flex: 1; height: 30px; position: relative; background: #0d0d0d; overflow: hidden }
.time-mark { position: absolute; top: 0; transform: translateX(-50%) }
.time-label { font-size: 0.75rem; color: #888; padding: 0.5rem }
.tracks-container { padding: 1rem 0; overflow: hidden }
.track { margin-bottom: 0.5rem }
.track-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; background: #0d0d0d; border-bottom: 1px solid #333 }
.track-name { font-size: 0.875rem; font-weight: 500; color: #ccc }
.track-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #333; border: none; border-radius: 4px; color: white; cursor: pointer; transition: background 0.2s }
.track-btn:hover { background: #6366f1 }
.track-lane { position: relative; height: 60px; background: #151515; border-bottom: 1px solid #333; overflow: hidden }
.audio-track .track-lane { background: #0a0a0a }
.clip { position: absolute; top: 8px; height: 44px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 6px; cursor: pointer; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s }
.audio-clip { background: linear-gradient(135deg, #10b981 0%, #059669 100%) }
.clip:hover { transform: scaleY(1.05); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) }
.audio-clip:hover { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) }
.clip-content { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem }
.clip-name { font-size: 0.75rem; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.clip-duration { font-size: 0.7rem; color: rgba(255, 255, 255, 0.7) }
.clip-handles { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none }
.handle { position: absolute; top: 0; bottom: 0; width: 8px; background: rgba(255, 255, 255, 0.3); cursor: ew-resize; pointer-events: auto }
.handle-left { left: 0; border-radius: 6px 0 0 6px }
.handle-right { right: 0; border-radius: 0 6px 6px 0 }
.playhead { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; z-index: 20; cursor: ew-resize; transform: translateX(-50%); will-change: left; transition: left 0.08s linear }
.playhead-line { width: 100%; height: 100%; background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.7) }
.playhead-knob { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #ef4444; filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.7)) }
.playhead-handle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ef4444; border-radius: 50%; cursor: grab; opacity: 0; transition: opacity 0.2s; border: 2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.7) }
.playhead:hover .playhead-handle { opacity: 1 }
.playhead-handle:active { cursor: grabbing }
</style>
