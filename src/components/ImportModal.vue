<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <h2 class="modal-title">Import Video</h2>
      <div class="form-group">
        <label class="form-label">Video File</label>
        <input type="file" accept="video/*" @change="handleFileSelect" class="form-input" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="confirmImport" :disabled="!selectedFile">Import</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['close', 'import'])
const selectedFile = ref<File | null>(null)

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) selectedFile.value = target.files[0]
}

function confirmImport() {
  if (selectedFile.value) {
    emit('import', selectedFile.value)
    selectedFile.value = null
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.modal { background: #1a1a1a; border: 1px solid #333; border-radius: 0.75rem; padding: 2rem; width: 400px; max-width: 90vw }
.modal-title { font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 1.5rem }
.form-group { margin-bottom: 1.25rem }
.form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #ccc; margin-bottom: 0.5rem }
.form-input { width: 100%; padding: 0.625rem; background: #0d0d0d; border: 1px solid #333; border-radius: 6px; color: white; font-size: 0.875rem }
.form-input:focus { outline: none; border-color: #6366f1 }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem }
.btn { padding: 0.625rem 1.25rem; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s }
.btn-secondary { background: #333; color: white }
.btn-secondary:hover { background: #444 }
.btn-primary { background: #6366f1; color: white }
.btn-primary:hover { background: #4f46e5 }
.btn:disabled { opacity: 0.5; cursor: not-allowed }
</style>
