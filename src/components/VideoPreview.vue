<template>
  <div class="video-preview">
    <div class="preview-container" :style="previewStyle">
      <div class="video-placeholder" v-if="!currentClip || !videoSource">
        <Video class="w-16 h-16 text-gray-600" />
        <p class="text-gray-500 mt-4">{{ placeholderText }}</p>
      </div>
      <video v-else ref="videoRef" :src="videoSource" :style="videoStyle" class="video-player" @play="onPlay" @pause="onPause" @ended="onPause" @loadedmetadata="onVideoLoaded" @timeupdate="onTimeUpdate" @error="onVideoError" @contextmenu.prevent="showContextMenu" @mousedown="onMouseDown" @click="togglePlay" tabindex="0" />
      <div v-if="(currentTool || activeTool) && transformInfo" class="transform-overlay">{{ transformInfo }}</div>
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

const props = defineProps<{ currentClip: VideoClip | null, aspectRatio?: string, activeTool?: 'rotate' | 'scale' | 'move' | null }>()
const emit = defineEmits<{ timeUpdate: [time: number], playStateChange: [isPlaying: boolean], rotate: [angle: number], rotateCommit: [angle: number], scale: [scale: number], scaleCommit: [scale: number], position: [x: number, y: number], positionCommit: [x: number, y: number] }>()
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const currentTool = ref<'rotate' | 'scale' | 'move' | null>(null)
let isMiddleDragging = false
let startX = 0
let startY = 0
let lastMouseX = 0
let lastMouseY = 0
let lastShiftKey = false
let lastCtrlKey = false
let initialRotation = 0
let initialScale = 1
let initialPosX = 0
let initialPosY = 0

function captureInitials() {
  if (!props.currentClip) return
  initialRotation = props.currentClip.rotation || 0
  initialScale = (props.currentClip as any).scale || 1
  initialPosX = (props.currentClip as any).positionX || 0
  initialPosY = (props.currentClip as any).positionY || 0
}

function startTool(tool: 'rotate' | 'scale' | 'move', x: number, y: number) {
  currentTool.value = tool
  startX = x
  startY = y
  captureInitials()
}

function updateTool(dx: number, dy: number, shift: boolean, ctrl: boolean) {
  if (!props.currentClip || !currentTool.value) return
  const snap = ctrl && shift
  const slow = shift && !ctrl
  if (currentTool.value === 'rotate') {
    const angle = snap
      ? Math.round((initialRotation + dx * (slow ? 0.1 : 0.5)) / 5) * 5
      : initialRotation + dx * (slow ? 0.1 : 0.5)
    emit('rotate', angle)
  } else if (currentTool.value === 'scale') {
    const val = initialScale - dy * (slow ? 0.001 : 0.005)
    const clamped = Math.min(5, Math.max(0.1, val))
    const scale = snap ? Math.round(clamped / 0.05) * 0.05 : clamped
    emit('scale', scale)
  } else if (currentTool.value === 'move') {
    const mult = slow ? 0.2 : 1
    const posX = snap ? Math.round((initialPosX + dx * mult) / 5) * 5 : initialPosX + dx * mult
    const posY = snap ? Math.round((initialPosY + dy * mult) / 5) * 5 : initialPosY + dy * mult
    emit('position', posX, posY)
  }
}

function commitTool() {
  if (!props.currentClip || !currentTool.value) return
  const dx = lastMouseX - startX
  const dy = lastMouseY - startY
  const snap = lastCtrlKey && lastShiftKey
  const slow = lastShiftKey && !lastCtrlKey
  if (currentTool.value === 'rotate') {
    const angle = snap
      ? Math.round((initialRotation + dx * (slow ? 0.1 : 0.5)) / 5) * 5
      : initialRotation + dx * (slow ? 0.1 : 0.5)
    emit('rotateCommit', angle)
  } else if (currentTool.value === 'scale') {
    const val = initialScale - dy * (slow ? 0.001 : 0.005)
    const clamped = Math.min(5, Math.max(0.1, val))
    const scale = snap ? Math.round(clamped / 0.05) * 0.05 : clamped
    emit('scaleCommit', scale)
  } else if (currentTool.value === 'move') {
    const mult = slow ? 0.2 : 1
    const posX = snap ? Math.round((initialPosX + dx * mult) / 5) * 5 : initialPosX + dx * mult
    const posY = snap ? Math.round((initialPosY + dy * mult) / 5) * 5 : initialPosY + dy * mult
    emit('positionCommit', posX, posY)
  }
  currentTool.value = null
  document.body.style.userSelect = ''
}

function onMouseDown(e: MouseEvent) {
  if (!props.currentClip) return
  if (props.activeTool) {
    e.preventDefault()
    return
  }
  if (e.button === 1) {
    e.preventDefault()
    startTool('move', e.clientX, e.clientY)
    isMiddleDragging = true
    document.body.style.userSelect = 'none'
  }
}

function onMouseMove(e: MouseEvent) {
  lastMouseX = e.clientX
  lastMouseY = e.clientY
  lastShiftKey = e.shiftKey
  lastCtrlKey = e.ctrlKey
  if (!props.currentClip) return
  if (isMiddleDragging && currentTool.value) {
    updateTool(e.clientX - startX, e.clientY - startY, e.shiftKey, e.ctrlKey)
  } else if (props.activeTool) {
    if (!currentTool.value) startTool(props.activeTool, e.clientX, e.clientY)
    if (currentTool.value) updateTool(e.clientX - startX, e.clientY - startY, e.shiftKey, e.ctrlKey)
  }
}

function onMouseUp(e: MouseEvent) {
  if (!props.currentClip) return
  if (isMiddleDragging && e.button === 1 && currentTool.value === 'move') {
    onMouseMove(e)
    commitTool()
    isMiddleDragging = false
  }
}

function onWindowMouseMove(e: MouseEvent) { onMouseMove(e) }
function onWindowMouseUp(e: MouseEvent) { onMouseUp(e) }

const videoSource = ref('')

function toPlainPath(p: string): string {
  if (p.startsWith('file://')) return p.slice(7)
  if (p.startsWith('local-video://')) return p.slice(14)
  return p
}

async function findExistingPath(clip: VideoClip | null): Promise<string | null> {
  if (!clip) return null
  const electron = typeof window !== 'undefined' && (window as any).electronAPI
  const candidates = [clip.proxy_path, clip.original_path].filter((p): p is string => !!p)
  if (!electron) return candidates[0] || null
  for (const p of candidates) {
    if (p.startsWith('blob:') || p.startsWith('http')) return p
    try {
      const stat = await electron.fileStat(toPlainPath(p))
      if (stat && stat.size > 0) return p
    } catch (e) {}
  }
  return null
}

async function resolveVideoSource(clip: VideoClip | null) {
  videoSource.value = ''
  if (!clip) return
  const resolved = await findExistingPath(clip)
  videoSource.value = resolved ? getVideoSource({ original_path: resolved }) : ''
}

const aspectRatioMap: Record<string, string> = {
  libre: '',
  '1:1': '1/1',
  '4:5': '4/5',
  '9:16': '9/16',
  '16:9': '16/9',
  '4:3': '4/3',
  '2:1': '2/1',
  '3:4': '3/4',
  '3:2': '3/2',
  '2:3': '2/3',
  '1:2': '1/2',
  '5:4': '5/4',
  '21:9': '21/9'
}

const placeholderText = computed(() => {
  return props.currentClip ? 'Archivo de video no encontrado' : 'No video selected'
})

const previewStyle = computed(() => {
  const ratio = props.aspectRatio || 'libre'
  if (ratio === 'libre' || !aspectRatioMap[ratio]) {
    return { flex: '1 1 auto', maxHeight: 'calc(100% - 80px)' }
  }
  return {
    aspectRatio: aspectRatioMap[ratio],
    flex: '0 0 auto',
    width: '100%',
    maxWidth: '100%',
    maxHeight: 'calc(100% - 80px)'
  }
})

const videoStyle = computed(() => {
  if (!props.currentClip) return {}
  const angle = props.currentClip.rotation || 0
  const mirror = props.currentClip.mirror ? -1 : 1
  const scale = (props.currentClip as any).scale || 1
  const posX = (props.currentClip as any).positionX || 0
  const posY = (props.currentClip as any).positionY || 0
  return {
    transform: `translate(${posX}px, ${posY}px) rotate(${angle}deg) scale(${scale}) scaleX(${mirror})`
  }
})

function onVideoLoaded() {
  if (videoRef.value) duration.value = videoRef.value.duration || 0
}
function onTimeUpdate() { if (videoRef.value) { currentTime.value = videoRef.value.currentTime || 0; emit('timeUpdate', currentTime.value) } }
function onVideoError(e: Event) { console.error('Video error:', e) }
function onPlay() { isPlaying.value = true; emit('playStateChange', true) }
function onPause() { isPlaying.value = false; emit('playStateChange', false) }
function togglePlay() { if (!videoRef.value || props.activeTool || isMiddleDragging) return; isPlaying.value ? videoRef.value.pause() : videoRef.value.play().catch(err => console.error('Play error:', err)) }
function skipForward() { if (videoRef.value) videoRef.value.currentTime = Math.min(videoRef.value.currentTime + 5, videoRef.value.duration || 0) }
function skipBackward() { if (videoRef.value) videoRef.value.currentTime = Math.max(videoRef.value.currentTime - 5, 0) }
function showContextMenu(e: MouseEvent) { menuPosition.value = { x: e.clientX, y: e.clientY }; showMenu.value = true }
function seekTo(time: number) { if (videoRef.value) { videoRef.value.currentTime = Math.max(0, Math.min(time, videoRef.value.duration || 0)); currentTime.value = time } }

defineExpose({ seekTo })

function handleKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName || ''
  if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(tag)) return
  if (e.code === 'Space') {
    e.preventDefault()
    e.stopPropagation()
    togglePlay()
  }
  if (e.code === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    if (currentTool.value === 'scale') currentTool.value = null
    emit('scaleCommit', 1)
  }
}

const transformInfo = computed(() => {
  const clip = props.currentClip as any
  if (!clip || (!currentTool.value && !props.activeTool)) return ''
  const tool = currentTool.value || props.activeTool
  if (tool === 'rotate') {
    return `Rotación: ${(clip.rotation || 0).toFixed(1)}°`
  } else if (tool === 'scale') {
    return `Escala: ${((clip.scale || 1) * 100).toFixed(0)}%`
  } else if (tool === 'move') {
    return `X: ${(clip.positionX || 0).toFixed(0)}px  Y: ${(clip.positionY || 0).toFixed(0)}px`
  }
  return ''
})

onMounted(() => {
  resolveVideoSource(props.currentClip)
  window.addEventListener('keydown', handleKeyDown, true)
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
})

watch(() => props.activeTool, (newTool, oldTool) => {
  if (oldTool && currentTool.value === oldTool && props.currentClip) {
    commitTool()
  }
  if (!newTool) {
    currentTool.value = null
  }
})

watch(volume, (v) => { if (videoRef.value) videoRef.value.volume = v })
watch(() => props.currentClip, async (newClip) => {
  isPlaying.value = false
  currentTime.value = 0
  await resolveVideoSource(newClip)
})
</script>

<style scoped>
.video-preview { display: flex; flex-direction: column; background: #0d0d0d; border-right: 1px solid #333; overflow: hidden; height: 100% }
.preview-container { display: flex; align-items: center; justify-content: center; background: #000; min-height: 200px; overflow: hidden; position: relative; width: 100% }
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
.transform-overlay { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-family: monospace; pointer-events: none; z-index: 10; border: 1px solid rgba(255,255,255,0.2) }
.volume-slider { width: 100px; height: 6px; -webkit-appearance: none; appearance: none; background: #333; border-radius: 3px; outline: none }
.volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer }
.volume-slider::-moz-range-thumb { width: 16px; height: 16px; background: #6366f1; border-radius: 50%; cursor: pointer; border: none }
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 0.5rem; z-index: 1000; min-width: 200px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) }
.context-menu-item { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #ccc; border-radius: 4px }
.context-menu-item:hover { background: #333 }
.context-menu-item span:first-child { color: #888 }
.context-menu-item span:last-child { color: #fff; font-weight: 500 }
</style>
