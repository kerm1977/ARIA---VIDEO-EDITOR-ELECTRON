<template>
  <div class="video-preview">
    <div class="preview-container">
      <div class="video-placeholder" v-if="!currentClip">
        <Video class="w-16 h-16 text-gray-600" />
        <p class="text-gray-500 mt-4">No video selected</p>
      </div>
      <video v-else ref="videoRef" :src="videoSource" class="video-player" @play="onPlay" @pause="onPause" @ended="onPause" @loadedmetadata="onVideoLoaded" @timeupdate="onTimeUpdate" @error="onVideoError" @contextmenu.prevent="showContextMenu" @click="togglePlay" tabindex="0" />
    </div>
    <div class="preview-controls">
      <div class="time-display">
        <span>{{ formatTime(currentTime) }}</span>/<span>{{ formatTime(duration) }}</span>
      </div>
      <div class="control-buttons" v-if="currentClip">
        <button class="control-btn" @click="skipBackward"><SkipBack class="w-5 h-5" /></button>
        <button class="control-btn play-btn" @click="togglePlay"><Play v-if="!isPlaying" class="w-6 h-6" /><Pause v-else class="w-6 h-6" /></button>
        <button class="control-btn" @click="skipForward"><SkipForward class="w-5 h-5" /></button>
      </div>
      <div class="volume-control" v-if="currentClip">
        <Volume2 class="w-5 h-5 text-gray-400" />
        <input type="range" v-model="volume" min="0" max="1" step="0.1" class="volume-slider" />
      </div>
    </div>
    <div v-if="showMenu" class="context-menu" :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }" @click="showMenu = false">
      <div class="context-menu-item"><span>Resolution:</span><span>{{ currentClip?.metadata.width }}x{{ currentClip?.metadata.height }}</span></div>
      <div class="context-menu-item"><span>FPS:</span><span>{{ currentClip?.metadata.fps.toFixed(2) }}</span></div>
      <div class="context-menu-item"><span>Codec:</span><span>{{ currentClip?.metadata.codec }}</span></div>
      <div class="context-menu-item"><span>Duration:</span><span>{{ formatDuration(currentClip?.metadata.duration || 0) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Video, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-vue-next'
import { formatTime, formatDuration, getVideoSource } from '../utils/video'
import type { VideoClip } from '../stores/project'

const props = defineProps<{ currentClip: VideoClip | null }>()
const emit = defineEmits<{ timeUpdate: [time: number], playStateChange: [isPlaying: boolean] }>()
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const videoSource = computed(() => getVideoSource(props.currentClip))

function onVideoLoaded() {
  if (videoRef.value) duration.value = videoRef.value.duration || 0
}
function onTimeUpdate() { if (videoRef.value) { currentTime.value = videoRef.value.currentTime || 0; emit('timeUpdate', currentTime.value) } }
function onVideoError(e: Event) { console.error('Video error:', e) }
function onPlay() { isPlaying.value = true; emit('playStateChange', true) }
function onPause() { isPlaying.value = false; emit('playStateChange', false) }
function togglePlay() { if (!videoRef.value) return; isPlaying.value ? videoRef.value.pause() : videoRef.value.play().catch(err => console.error('Play error:', err)) }
function skipForward() { if (videoRef.value) videoRef.value.currentTime = Math.min(videoRef.value.currentTime + 5, videoRef.value.duration || 0) }
function skipBackward() { if (videoRef.value) videoRef.value.currentTime = Math.max(videoRef.value.currentTime - 5, 0) }
function showContextMenu(e: MouseEvent) { menuPosition.value = { x: e.clientX, y: e.clientY }; showMenu.value = true }
function seekTo(time: number) { if (videoRef.value) { videoRef.value.currentTime = Math.max(0, Math.min(time, videoRef.value.duration || 0)); currentTime.value = time } }

defineExpose({ seekTo })

function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement)?.tagName || '')) {
    e.preventDefault()
    e.stopPropagation()
    togglePlay()
  }
}

onMounted(() => { window.addEventListener('keydown', handleKeyDown, true) })
onUnmounted(() => { window.removeEventListener('keydown', handleKeyDown, true) })

watch(volume, (v) => { if (videoRef.value) videoRef.value.volume = v })
watch(() => props.currentClip, () => { isPlaying.value = false; currentTime.value = 0 })
</script>

<style scoped>
.video-preview { display: flex; flex-direction: column; background: #0d0d0d; border-right: 1px solid #333; overflow: hidden; height: 100% }
.preview-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #000; min-height: 400px; overflow: hidden; position: relative; width: 100% }
.video-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem }
.video-player { width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0 }
.preview-controls { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #0d0d0d; border-top: 2px solid #333; flex-shrink: 0; margin-top: auto }
.time-display { display: flex; align-items: center; gap: 0.5rem; font-family: monospace; font-size: 1rem; color: #fff; font-weight: 500; min-width: 100px }
.control-buttons { display: flex; align-items: center; gap: 0.75rem; flex: 1; justify-content: center }
.control-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #333; border: none; border-radius: 8px; color: white; cursor: pointer; transition: all 0.2s }
.control-btn:hover { background: #6366f1; transform: scale(1.05) }
.play-btn { width: 50px; height: 50px; background: #6366f1 }
.play-btn:hover { background: #4f46e5 }
.volume-control { display: flex; align-items: center; gap: 0.75rem; min-width: 120px }
.volume-slider { width: 100px; height: 6px; -webkit-appearance: none; appearance: none; background: #333; border-radius: 3px; outline: none }
.volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer }
.volume-slider::-moz-range-thumb { width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; border: none }
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 0.5rem; z-index: 1000; min-width: 200px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) }
.context-menu-item { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #ccc; border-radius: 4px }
.context-menu-item:hover { background: #333 }
.context-menu-item span:first-child { color: #888 }
.context-menu-item span:last-child { color: #fff; font-weight: 500 }
</style>
