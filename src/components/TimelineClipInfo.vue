<template>
  <div v-if="props.visible" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h3>Información del Video</h3>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Formato:</span><span class="info-value">{{ data?.metadata?.container || 'N/A' }}</span></div>
        <div class="info-item"><span class="info-label">Codec:</span><span class="info-value">{{ data?.metadata?.codec || 'N/A' }}</span></div>
        <div class="info-item"><span class="info-label">Resolución:</span><span class="info-value">{{ data?.metadata?.width || 0 }}x{{ data?.metadata?.height || 0 }}</span></div>
        <div class="info-item"><span class="info-label">FPS:</span><span class="info-value">{{ data?.metadata?.fps || 0 }}</span></div>
        <div class="info-item"><span class="info-label">Bitrate:</span><span class="info-value">{{ formatBitrate(data?.metadata?.bitrate || 0) }}</span></div>
        <div class="info-item"><span class="info-label">Duración:</span><span class="info-value">{{ formatTime(data?.metadata?.duration || 0) }}</span></div>
        <div class="info-item"><span class="info-label">Tamaño:</span><span class="info-value">{{ formatFileSize(data?.metadata?.file_size || 0) }}</span></div>
        <div class="info-item"><span class="info-label">Audio Codec:</span><span class="info-value">{{ data?.metadata?.audioCodec || 'N/A' }}</span></div>
        <div class="info-item"><span class="info-label">Ubicación:</span><span class="info-value">{{ data?.original_path || 'N/A' }}</span></div>
      </div>
      <button class="modal-close" @click="emit('close')">Cerrar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTime } from '../utils/video'
import type { VideoClip } from '../stores/project'

const props = defineProps<{ visible: boolean; data: VideoClip | null }>()
const emit = defineEmits<{ close: [] }>()

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
</script>

<style scoped>
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
