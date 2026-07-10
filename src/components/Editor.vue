<template>
  <div class="editor">
    <div class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack"><ArrowLeft class="w-5 h-5" /></button>
        <h1 class="project-title">{{ currentProject?.name || 'Untitled' }}</h1>
      </div>
      <div class="header-center">
        <button class="header-btn" @click="importVideo"><Upload class="w-5 h-5" />Import</button>
        <button class="header-btn" @click="exportProject"><Download class="w-5 h-5" />Export</button>
      </div>
      <div class="header-right">
        <button class="header-btn" @click="showProxySettings = true"><Settings class="w-5 h-5" /></button>
      </div>
    </div>
    <div class="editor-content">
      <div class="main-panel"><VideoPreview ref="videoPreview" :current-clip="selectedClip" @timeUpdate="handleTimeUpdate" @playStateChange="handlePlayStateChange" /></div>
    </div>
    <div class="timeline-panel"><Timeline :tracks="currentProject?.tracks || []" :duration="currentProject?.duration || 0" :currentTime="currentTime" :isPlaying="isPlaying" @add-clip="showImportModal = true" @select-clip="selectedClip = $event" @timeUpdate="handleTimelineTimeUpdate" @cutClip="handleCutClip" @addMedia="showImportModal = true" /></div>
    <ProxySettingsModal v-if="showProxySettings" :settings="proxySettings" @close="showProxySettings = false" @save="saveProxySettings" />
    <ImportModal v-if="showImportModal" @close="showImportModal = false" @import="handleImport" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Upload, Download, Settings } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { storeToRefs } from 'pinia'
import VideoPreview from './VideoPreview.vue'
import Timeline from './Timeline.vue'
import ProxySettingsModal from './ProxySettingsModal.vue'
import ImportModal from './ImportModal.vue'
import type { VideoClip } from '../stores/project'

const projectStore = useProjectStore()
const { currentProject, proxySettings } = storeToRefs(projectStore)
const selectedClip = ref<VideoClip | null>(null)
const showProxySettings = ref(false)
const showImportModal = ref(false)
const currentTime = ref(0)
const isPlaying = ref(false)
const videoPreview = ref<{ seekTo: (time: number) => void } | null>(null)

const isElectron = () => typeof window !== 'undefined' && window.electronAPI

function goBack() { projectStore.setCurrentProject(null) }
function saveProxySettings(settings: any) { Object.assign(proxySettings.value, settings); showProxySettings.value = false }
function handleTimeUpdate(time: number) { currentTime.value = time }
function handlePlayStateChange(playing: boolean) { isPlaying.value = playing }
function handleTimelineTimeUpdate(time: number) { currentTime.value = time; videoPreview.value?.seekTo(time) }
async function importVideo() {
  if (!isElectron()) {
    showImportModal.value = true
    return
  }
  try {
    const filePath = await window.electronAPI.dialogOpen({
      properties: ['openFile'],
      filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
    })
    if (filePath) {
      await processVideoImport(filePath)
    }
  } catch (error) {
    console.warn('Electron dialog failed, falling back to web input:', error)
    showImportModal.value = true
  }
}
async function processVideoImport(filePath: string) {
  try {
    const metadata = await projectStore.getVideoMetadata(filePath)
    let proxyPath: string | undefined
    if (isElectron() && proxySettings.value.enabled) {
      proxyPath = await projectStore.generateProxy(filePath, proxySettings.value)
    }
    const clip: VideoClip = {
      id: crypto.randomUUID(),
      original_path: filePath,
      proxy_path: proxyPath,
      metadata,
      start_time: 0,
      end_time: metadata.duration,
      in_point: 0,
      out_point: metadata.duration
    }
    if (currentProject.value) {
      if (currentProject.value.tracks.length === 0) currentProject.value.tracks.push({ id: crypto.randomUUID(), name: 'Video 1', clips: [] })
      await projectStore.addClipToTrack(currentProject.value.tracks[0].id, clip)
      selectedClip.value = clip
    }
  } catch (error) {
    console.error('Failed to import video:', error)
    alert('Failed to import video: ' + error)
  }
}
function handleCutClip() {
  if (!currentProject.value || currentProject.value.tracks.length === 0) return
  const track = currentProject.value.tracks[0]
  const cutTime = currentTime.value
  const clipIndex = track.clips.findIndex(c => c.start_time <= cutTime && c.end_time >= cutTime)
  if (clipIndex === -1) return
  const clip = track.clips[clipIndex]
  if (cutTime <= clip.start_time + 0.1 || cutTime >= clip.end_time - 0.1) return
  const splitPoint = cutTime - clip.start_time
  const firstPart: VideoClip = {
    ...clip,
    id: crypto.randomUUID(),
    end_time: cutTime,
    out_point: clip.in_point + splitPoint
  }
  const secondPart: VideoClip = {
    ...clip,
    id: crypto.randomUUID(),
    start_time: cutTime,
    in_point: clip.in_point + splitPoint
  }
  track.clips.splice(clipIndex, 1, firstPart, secondPart)
}

async function handleImport(file: File) {
  const url = URL.createObjectURL(file)
  const mockClip: VideoClip = {
    id: crypto.randomUUID(),
    original_path: file.name,
    proxy_path: url,
    metadata: { duration: 0, width: 1920, height: 1080, fps: 30, codec: 'h264', bitrate: 5000000, file_size: file.size },
    start_time: 0, end_time: 60, in_point: 0, out_point: 60
  }
  if (currentProject.value) {
    if (currentProject.value.tracks.length === 0) currentProject.value.tracks.push({ id: crypto.randomUUID(), name: 'Video 1', clips: [] })
    await projectStore.addClipToTrack(currentProject.value.tracks[0].id, mockClip)
    selectedClip.value = mockClip
  }
  showImportModal.value = false
}

async function exportProject() {
  if (!isElectron()) {
    alert('Export is only available in Electron mode')
    return
  }
  try {
    const outputPath = await window.electronAPI.dialogSave({
      filters: [{ name: 'Video', extensions: ['mp4'] }]
    })
    if (outputPath) {
      await projectStore.exportVideo(outputPath)
      alert('Export completed successfully!')
    }
  } catch (error) {
    console.error('Failed to export:', error)
    alert('Export failed: ' + error)
  }
}
</script>

<style scoped>
.editor { display: flex; flex-direction: column; height: 100vh; background: #0d0d0d; overflow: hidden }
.editor-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #1a1a1a; border-bottom: 1px solid #333; flex-shrink: 0 }
.header-left { display: flex; align-items: center; gap: 1rem }
.back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #333; border: none; border-radius: 6px; color: white; cursor: pointer; transition: background 0.2s }
.back-btn:hover { background: #444 }
.project-title { font-size: 1.25rem; font-weight: 600; color: white }
.header-center { display: flex; align-items: center; gap: 0.75rem }
.header-right { display: flex; align-items: center; gap: 0.75rem }
.header-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: #333; border: none; border-radius: 6px; color: white; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.2s }
.header-btn:hover { background: #444 }
.editor-content { flex: 1; display: flex; overflow: hidden }
.main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden }
.timeline-panel { height: 300px; border-top: 1px solid #333; flex-shrink: 0; width: 100% }
</style>
