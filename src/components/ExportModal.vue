<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h2 class="modal-title">Exportar video</h2>
      <div class="modal-body">
        <label class="form-row">
          <span>Video</span>
          <select v-model="options.videoCodec">
            <option value="libx264">H.264</option>
            <option value="libx265">H.265</option>
          </select>
        </label>
        <label class="form-row">
          <span>Audio</span>
          <select v-model="options.audioCodec">
            <option value="aac">AAC</option>
            <option value="libmp3lame">MP3</option>
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="emit('close')">Cancelar</button>
        <button class="btn btn-primary" @click="handleExport">Exportar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  close: []
  export: [options: { videoCodec: 'libx264' | 'libx265'; audioCodec: 'aac' | 'libmp3lame'; container: 'mp4' }]
}>()

const options = ref({
  videoCodec: 'libx264' as const,
  audioCodec: 'aac' as const,
  container: 'mp4' as const
})

function handleExport() {
  emit('export', options.value)
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1100 }
.modal-content { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; min-width: 320px }
.modal-title { color: #fff; font-size: 1.25rem; margin-bottom: 1rem }
.modal-body { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem }
.form-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #ccc }
.form-row select { background: #333; color: #fff; border: 1px solid #444; border-radius: 6px; padding: 0.5rem 0.75rem }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem }
.btn { padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 500 }
.btn-secondary { background: #333; color: #fff }
.btn-primary { background: #6366f1; color: #fff }
</style>
