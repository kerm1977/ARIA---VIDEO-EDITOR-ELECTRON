<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <h2 class="modal-title">Proxy Settings</h2>
      <div class="form-group">
        <label class="form-label"><input type="checkbox" v-model="settings.enabled" /> Enable Proxies</label>
      </div>
      <div class="form-group">
        <label class="form-label">Resolution</label>
        <select v-model="settings.resolution" class="form-select">
          <option value="1920:1080">1080p (1920x1080)</option>
          <option value="1280:720">720p (1280x720)</option>
          <option value="854:480">480p (854x480)</option>
          <option value="640:360">360p (640x360)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Codec</label>
        <select v-model="settings.codec" class="form-select">
          <option value="libx264">H.264</option>
          <option value="libx265">H.265</option>
          <option value="libvpx-vp9">VP9</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Bitrate</label>
        <select v-model="settings.bitrate" class="form-select">
          <option value="1M">1 Mbps</option>
          <option value="2M">2 Mbps</option>
          <option value="5M">5 Mbps</option>
          <option value="10M">10 Mbps</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label"><input type="checkbox" v-model="settings.useGPU" /> Use GPU Acceleration</label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="$emit('save', settings)">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const props = defineProps<{ settings: any }>()
const emit = defineEmits(['close', 'save'])

const settings = reactive({ ...props.settings })
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.modal { background: #1a1a1a; border: 1px solid #333; border-radius: 0.75rem; padding: 2rem; width: 400px; max-width: 90vw }
.modal-title { font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 1.5rem }
.form-group { margin-bottom: 1.25rem }
.form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #ccc; margin-bottom: 0.5rem }
.form-select { width: 100%; padding: 0.625rem; background: #0d0d0d; border: 1px solid #333; border-radius: 6px; color: white; font-size: 0.875rem }
.form-select:focus { outline: none; border-color: #6366f1 }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem }
.btn { padding: 0.625rem 1.25rem; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s }
.btn-secondary { background: #333; color: white }
.btn-secondary:hover { background: #444 }
.btn-primary { background: #6366f1; color: white }
.btn-primary:hover { background: #4f46e5 }
</style>
