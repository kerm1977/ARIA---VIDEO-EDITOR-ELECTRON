<template>
  <div class="preview-container" :style="previewStyle">
    <div class="video-placeholder" v-if="!props.currentClip || !videoSource">
      <Video class="w-16 h-16 text-gray-600" />
      <p class="text-gray-500 mt-4">{{ placeholderText }}</p>
    </div>
    <video v-else ref="videoRef" :src="videoSource" :style="videoStyle" class="video-player" @play="onPlay" @pause="onPause" @ended="onEnded" @loadedmetadata="onVideoLoaded" @error="onVideoError" @contextmenu.prevent="showContextMenu" @mousedown="onMouseDown" @click="togglePlay" tabindex="0" />
    <PreviewOverlay :clip="props.currentClip" :currentTool="currentTool" :activeTool="props.activeTool" :info="transformInfo" :showMenu="showMenu" :menuPosition="menuPosition" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Video } from 'lucide-vue-next'
import { useVideoSource } from '../composables/useVideoSource'
import { usePreviewTransform } from '../composables/usePreviewTransform'
import PreviewOverlay from './PreviewOverlay.vue'
import type { VideoClip } from '../stores/project'

const props = defineProps<{
  currentClip: VideoClip | null
  selectedClip?: VideoClip | null
  currentTime?: number
  aspectRatio?: string
  activeTool?: 'rotate' | 'scale' | 'move' | null
  volume?: number
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  playStateChange: [isPlaying: boolean]
  rotate: [angle: number]
  rotateCommit: [angle: number]
  scale: [scale: number]
  scaleCommit: [scale: number]
  position: [x: number, y: number]
  positionCommit: [x: number, y: number]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const { videoSource, resolveVideoSource } = useVideoSource()
const { currentTool, videoStyle, transformInfo, onMouseDown } = usePreviewTransform(props, emit)

const aspectRatioMap: Record<string, string> = {
  libre: '', '1:1': '1/1', '4:5': '4/5', '9:16': '9/16', '16:9': '16/9',
  '4:3': '4/3', '2:1': '2/1', '3:4': '3/4', '3:2': '3/2', '2:3': '2/3',
  '1:2': '1/2', '5:4': '5/4', '21:9': '21:9'
}

const placeholderText = computed(() => props.currentClip ? 'Archivo de video no encontrado' : 'No video selected')

const previewStyle = computed(() => {
  const ratio = props.aspectRatio || 'libre'
  if (ratio === 'libre' || !aspectRatioMap[ratio]) {
    return { flex: '1 1 auto', maxHeight: 'calc(100% - 80px)' }
  }
  return { aspectRatio: aspectRatioMap[ratio], flex: '0 0 auto', width: '100%', maxWidth: '100%', maxHeight: 'calc(100% - 80px)' }
})

function onVideoLoaded(e: Event) {
  if (e.target !== videoRef.value || !videoRef.value || !props.currentClip) return
  setVideoTime(props.currentTime ?? 0, props.currentClip)
  if (props.isPlaying) {
    videoRef.value.play().catch(err => console.error('Play error:', err))
  }
}

function onVideoError(e: Event) { console.error('Video error:', e) }
function onPlay(e: Event) {
  if (e.target !== videoRef.value) return
  emit('playStateChange', true)
}
function onPause(e: Event) {
  if (e.target !== videoRef.value) return
  if (videoRef.value?.ended) return
  emit('playStateChange', false)
}
function onEnded(e: Event) {
  if (e.target !== videoRef.value) return
  // playback loop continues in editor
}

function setVideoTime(globalTime: number, clip: VideoClip) {
  if (!clip || !videoRef.value) return
  const maxDuration = videoRef.value.duration || clip.metadata.duration || 0
  const sourceTime = Math.max(0, Math.min(globalTime - clip.start_time + clip.in_point, maxDuration))
  const currentGlobal = videoRef.value.currentTime + clip.start_time - clip.in_point
  if (Math.abs(currentGlobal - globalTime) > 0.05) {
    videoRef.value.currentTime = sourceTime
  }
}

function seekTo(time: number) {
  const clip = props.currentClip
  if (!clip || !videoRef.value) return
  const maxDuration = videoRef.value.duration || clip.metadata.duration || 0
  const t = Math.max(0, Math.min(time - clip.start_time + clip.in_point, maxDuration))
  videoRef.value.currentTime = t
}

function togglePlay() {
  if (props.activeTool) return
  emit('playStateChange', !props.isPlaying)
}

function skipForward() {
  if (videoRef.value && props.currentClip) {
    const maxDuration = videoRef.value.duration || props.currentClip.metadata.duration || 0
    videoRef.value.currentTime = Math.min(videoRef.value.currentTime + 5, maxDuration)
  }
}

function skipBackward() {
  if (videoRef.value) videoRef.value.currentTime = Math.max(videoRef.value.currentTime - 5, 0)
}

function showContextMenu(e: MouseEvent) {
  menuPosition.value = { x: e.clientX, y: e.clientY }
  showMenu.value = true
}

onMounted(() => { resolveVideoSource(props.currentClip) })

watch(() => props.volume, (v) => { if (videoRef.value && v !== undefined) videoRef.value.volume = v })

watch(() => props.currentClip, async (clip) => {
  await resolveVideoSource(clip)
  if (clip && videoRef.value && videoSource.value) {
    setVideoTime(props.currentTime ?? 0, clip)
    if (props.isPlaying) videoRef.value.play().catch(err => console.error('Play error:', err))
  }
})

watch(() => props.isPlaying, (playing) => {
  if (!videoRef.value) return
  if (playing) videoRef.value.play().catch(err => console.error('Play error:', err))
  else videoRef.value.pause()
})

defineExpose({ seekTo, togglePlay, skipForward, skipBackward })
</script>

<style scoped>
.preview-container { display: flex; align-items: center; justify-content: center; background: #000; min-height: 200px; overflow: hidden; position: relative; width: 100% }
.video-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem }
.video-player { width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0 }
</style>
