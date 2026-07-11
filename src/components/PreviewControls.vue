<template>
  <div class="preview-controls">
    <div class="time-display" @click="handleTimeDisplayClick">
      <span>{{ formatTime(props.currentTime) }}</span>/<span>{{ formatTime(props.duration) }}</span>
    </div>
    <div class="control-buttons">
      <button class="control-btn" :disabled="!props.currentClip" @click="emit('skipBackward')"><SkipBack class="w-5 h-5" /></button>
      <button class="control-btn play-btn" :disabled="!props.currentClip" @click="emit('togglePlay')"><Play v-if="!props.isPlaying" class="w-6 h-6" /><Pause v-else class="w-6 h-6" /></button>
      <button class="control-btn" :disabled="!props.currentClip" @click="emit('skipForward')"><SkipForward class="w-5 h-5" /></button>
    </div>
    <div class="volume-control" v-if="props.currentClip">
      <Volume2 class="w-5 h-5 text-gray-400" />
      <input type="range" :value="props.volume" min="0" max="1" step="0.1" class="volume-slider" @input="onVolumeChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-vue-next'
import { formatTime } from '../utils/video'
import type { VideoClip } from '../stores/project'

const props = defineProps<{
  currentClip: VideoClip | null
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
}>()

const emit = defineEmits<{
  togglePlay: []
  skipForward: []
  skipBackward: []
  volumeChange: [volume: number]
  seek: [time: number]
}>()

function onVolumeChange(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  emit('volumeChange', v)
}

function handleTimeDisplayClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  if (!target || props.duration <= 0) return
  const rect = target.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  emit('seek', ratio * props.duration)
}
</script>

<style scoped>
.preview-controls { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #0d0d0d; border-top: 2px solid #333; flex-shrink: 0; margin-top: auto }
.time-display { display: flex; align-items: center; gap: 0.5rem; font-family: monospace; font-size: 1rem; color: #fff; font-weight: 500; min-width: 100px; cursor: pointer; user-select: none }
.control-buttons { display: flex; align-items: center; gap: 0.75rem; flex: 1; justify-content: center }
.control-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #333; border: none; border-radius: 8px; color: white; cursor: pointer; transition: all 0.2s }
.control-btn:hover:not(:disabled) { background: #6366f1; transform: scale(1.05) }
.control-btn:disabled { opacity: 0.5; cursor: not-allowed }
.play-btn { width: 50px; height: 50px; background: #6366f1 }
.play-btn:hover { background: #4f46e5 }
.volume-control { display: flex; align-items: center; gap: 0.75rem; min-width: 120px }
.volume-slider { width: 100px; height: 6px; -webkit-appearance: none; appearance: none; background: #333; border-radius: 3px; outline: none }
.volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer }
.volume-slider::-moz-range-thumb { width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; border: none }
</style>
