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
          <div v-for="clip in track.clips" :key="clip.id" class="clip" :class="{ 'audio-clip': track.type === 'audio' }" :style="getClipStyle(clip, duration)" @click="$emit('selectClip', clip)" @contextmenu.prevent="showContextMenu($event, clip)">
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
    <div v-if="contextMenu.visible" class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click="hideContextMenu">
      <div class="context-menu-item" @click="showClipInfo">Información</div>
      <div class="context-menu-item" @click="goToFileLocation">Ir a ubicación de archivo</div>
      <div class="context-menu-item" @click="createProxy">Crear proxy</div>
    </div>
    <div v-if="clipInfoModal.visible" class="modal-overlay" @click="hideClipInfo">
      <div class="modal-content" @click.stop>
        <h3>Información del Video</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Formato:</span><span class="info-value">{{ clipInfoModal.data?.metadata?.container || 'N/A' }}</span></div>
          <div class="info-item"><span class="info-label">Codec:</span><span class="info-value">{{ clipInfoModal.data?.metadata?.codec || 'N/A' }}</span></div>
          <div class="info-item"><span class="info-label">Resolución:</span><span class="info-value">{{ clipInfoModal.data?.metadata?.width || 0 }}x{{ clipInfoModal.data?.metadata?.height || 0 }}</span></div>
          <div class="info-item"><span class="info-label">FPS:</span><span class="info-value">{{ clipInfoModal.data?.metadata?.fps || 0 }}</span></div>
          <div class="info-item"><span class="info-label">Bitrate:</span><span class="info-value">{{ formatBitrate(clipInfoModal.data?.metadata?.bitrate || 0) }}</span></div>
          <div class="info-item"><span class="info-label">Duración:</span><span class="info-value">{{ formatTime(clipInfoModal.data?.metadata?.duration || 0) }}</span></div>
          <div class="info-item"><span class="info-label">Tamaño:</span><span class="info-value">{{ formatFileSize(clipInfoModal.data?.metadata?.file_size || 0) }}</span></div>
          <div class="info-item"><span class="info-label">Audio Codec:</span><span class="info-value">{{ clipInfoModal.data?.metadata?.audioCodec || 'N/A' }}</span></div>
          <div class="info-item"><span class="info-label">Ubicación:</span><span class="info-value">{{ clipInfoModal.data?.original_path || 'N/A' }}</span></div>
        </div>
        <button class="modal-close" @click="hideClipInfo">Cerrar</button>
      </div>
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
const contextMenu = ref({ visible: false, x: 0, y: 0, clip: null as VideoClip | null })
const clipInfoModal = ref({ visible: false, data: null as VideoClip | null })

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

function showContextMenu(event: MouseEvent, clip: VideoClip) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    clip
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

function showClipInfo() {
  clipInfoModal.value = {
    visible: true,
    data: contextMenu.value.clip
  }
  hideContextMenu()
}

function hideClipInfo() {
  clipInfoModal.value.visible = false
}

function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) return (bitrate / 1000000).toFixed(2) + ' Mbps'
  if (bitrate >= 1000) return (bitrate / 1000).toFixed(2) + ' Kbps'
  return bitrate + ' bps'
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return bytes + ' bytes'
}

function goToFileLocation() {
  if (contextMenu.value.clip?.original_path && typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.showItemInFolder(contextMenu.value.clip.original_path)
  }
  hideContextMenu()
}

function createProxy() {
  if (contextMenu.value.clip) {
    emit('selectClip', contextMenu.value.clip)
  }
  hideContextMenu()
}

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
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); z-index: 1000; min-width: 200px; overflow: hidden }
.context-menu-item { padding: 0.75rem 1rem; cursor: pointer; transition: background 0.2s; color: #ccc; font-size: 0.875rem }
.context-menu-item:hover { background: #6366f1; color: white }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.modal-content { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 2rem; min-width: 500px; max-width: 600px }
.modal-content h3 { color: white; font-size: 1.25rem; margin-bottom: 1.5rem }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem }
.info-item { display: flex; flex-direction: column; gap: 0.25rem }
.info-label { font-size: 0.75rem; color: #888; font-weight: 500 }
.info-value { font-size: 0.875rem; color: #ccc }
.modal-close { padding: 0.75rem 1.5rem; background: #6366f1; border: none; border-radius: 6px; color: white; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s }
.modal-close:hover { background: #8b5cf6 }
</style>
