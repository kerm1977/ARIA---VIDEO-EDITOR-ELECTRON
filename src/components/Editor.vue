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
    <Toolbar @addMedia="importVideo" @cut="handleCutClip" @text="handleText" @speed="handleSpeed" @recordAudio="handleRecordAudio" @addAudio="handleGuitar" @flip="handleFlip" @proxy="handleProxy" @process="handleProcess" />
    <div class="timeline-panel"><Timeline :tracks="currentProject?.tracks || []" :duration="currentProject?.duration || 0" :currentTime="currentTime" :isPlaying="isPlaying" @add-clip="showImportModal = true" @select-clip="selectedClip = $event" @timeUpdate="handleTimelineTimeUpdate" @cutClip="handleCutClip" @addMedia="showImportModal = true" /></div>
    <ProxySettingsModal v-if="showProxySettings" :settings="proxySettings" @close="showProxySettings = false" @save="saveProxySettings" />
    <ImportModal v-if="showImportModal" @close="showImportModal = false" @import="handleImport" />
    <div v-if="isConverting" class="conversion-progress">
      <div class="progress-overlay">
        <div class="progress-content">
          <h3>Converting Video</h3>
          <p>{{ conversionMessage }}</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: conversionProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.round(conversionProgress) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Upload, Download, Settings } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { storeToRefs } from 'pinia'
import VideoPreview from './VideoPreview.vue'
import Timeline from './Timeline.vue'
import Toolbar from './Toolbar.vue'
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
const conversionProgress = ref(0)
const conversionMessage = ref('')
const isConverting = ref(false)

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
    let finalPath = filePath
    let needsConversion = false

    // Check if format needs conversion
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    const container = (metadata as any).container?.toLowerCase() || ''
    const audioCodec = (metadata as any).audioCodec?.toLowerCase() || ''

    // Convert MKV to MP4
    if (ext === 'mkv' || container === 'matroska') {
      needsConversion = true
    }

    // Convert AC3/EAC3 audio to AAC
    if (audioCodec === 'ac3' || audioCodec === 'eac3') {
      needsConversion = true
    }

    // Convert other non-browser formats
    if (['avi', 'wmv', 'mov'].includes(ext) && !metadata.codec?.includes('h264')) {
      needsConversion = true
    }

    if (needsConversion && isElectron()) {
      console.log('Converting video for browser compatibility')
      isConverting.value = true
      conversionProgress.value = 0
      conversionMessage.value = 'Starting conversion...'

      const convertSettings = {
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoBitrate: '2M',
        audioBitrate: '128k'
      }
      finalPath = await projectStore.convertVideo(filePath, convertSettings)

      isConverting.value = false
      conversionProgress.value = 100
      conversionMessage.value = 'Conversion complete'

      // Update metadata after conversion
      const newMetadata = await projectStore.getVideoMetadata(finalPath)
      Object.assign(metadata, newMetadata)
    }

    const clip: VideoClip = {
      id: crypto.randomUUID(),
      original_path: finalPath,
      proxy_path: undefined,
      metadata,
      start_time: 0,
      end_time: metadata.duration,
      in_point: 0,
      out_point: metadata.duration
    }
    if (currentProject.value) {
      // Ensure a video track exists
      let videoTrack = currentProject.value.tracks.find(t => t.type === 'video')
      if (!videoTrack) {
        videoTrack = { id: crypto.randomUUID(), name: 'Video 1', type: 'video', clips: [] }
        const updatedProject = { ...currentProject.value, tracks: [...currentProject.value.tracks, videoTrack] }
        projectStore.setCurrentProject(updatedProject)
      }
      await projectStore.addClipToTrack(videoTrack.id, clip)
      selectedClip.value = clip
    } else {
      console.error('No current project to add clip to')
    }
  } catch (error) {
    console.error('Failed to import video:', error)
    isConverting.value = false
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
  const firstPart = {
    ...clip,
    id: crypto.randomUUID(),
    end_time: cutTime,
    out_point: clip.in_point + splitPoint
  }
  const secondPart = {
    ...clip,
    id: crypto.randomUUID(),
    start_time: cutTime,
    in_point: clip.in_point + splitPoint
  }
  track.clips.splice(clipIndex, 1, firstPart, secondPart)
}

function handleText() {
  alert('Text tool coming soon')
}

function handleSpeed() {
  alert('Speed control coming soon')
}

function handleRecordAudio() {
  alert('Audio recording coming soon')
}

async function handleGuitar() {
  if (!currentProject.value) {
    alert('Please create a project first')
    return
  }

  if (!isElectron()) {
    // Web mode: show audio import modal
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await processAudioImport(file.name, URL.createObjectURL(file), file.size)
      }
    }
    input.click()
    return
  }
  try {
    const filePath = await window.electronAPI.dialogOpen({
      properties: ['openFile'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma'] }]
    })
    if (filePath) {
      await processAudioImport(filePath)
    }
  } catch (error) {
    console.error('Failed to import audio:', error)
    alert('Failed to import audio: ' + error)
  }
}

async function processAudioImport(filePath: string, webUrl?: string, fileSize?: number) {
  try {
    let metadata
    if (isElectron() && !webUrl) {
      metadata = await projectStore.getAudioMetadata(filePath)
    } else {
      // Mock metadata for web mode
      metadata = {
        duration: 60,
        codec: 'aac',
        channels: 2,
        sample_rate: 44100,
        bitrate: 128000,
        file_size: fileSize || 0
      }
    }

    const audioClip = {
      id: crypto.randomUUID(),
      original_path: filePath,
      metadata,
      start_time: 0,
      end_time: metadata.duration,
      in_point: 0,
      out_point: metadata.duration
    }

    // Find or create audio track
    let audioTrack = currentProject.value!.tracks.find(t => t.type === 'audio')
    if (!audioTrack) {
      audioTrack = {
        id: crypto.randomUUID(),
        name: 'Audio 1',
        type: 'audio',
        clips: []
      }
      currentProject.value!.tracks.push(audioTrack)
    }

    // Add clip to audio track
    await projectStore.addClipToTrack(audioTrack.id, audioClip)
    alert('Audio imported successfully!')
  } catch (error) {
    console.error('Failed to process audio:', error)
    alert('Failed to process audio: ' + error)
  }
}

function handleFlip() {
  alert('Flip tool coming soon')
}

function handleProxy() {
  showProxySettings.value = true
}

function handleProcess() {
  alert('Process tool coming soon')
}

onMounted(() => {
  if (isElectron()) {
    window.electronAPI.onConversionProgress((data) => {
      conversionProgress.value = data.progress
      conversionMessage.value = data.message
    })
  }
})

async function handleImport(file: File) {
  const url = URL.createObjectURL(file)
  const mockClip: VideoClip = {
    id: crypto.randomUUID(),
    original_path: file.name,
    proxy_path: url,
    metadata: { duration: 0, width: 1920, height: 1080, fps: 30, codec: 'h264', container: 'mp4', bitrate: 5000000, file_size: file.size, hasAudio: true, audioCodec: 'aac' },
    start_time: 0, end_time: 60, in_point: 0, out_point: 60
  }
  if (currentProject.value) {
    if (currentProject.value.tracks.length === 0) currentProject.value.tracks.push({ id: crypto.randomUUID(), name: 'Video 1', type: 'video', clips: [] })
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
.editor-content { flex: 1; display: flex; flex-direction: column; overflow: hidden }
.main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 400px }
.timeline-panel { height: 300px; border-top: 1px solid #333; flex-shrink: 0; width: 100% }
.conversion-progress { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.progress-overlay { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center }
.progress-content { background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333; min-width: 400px; text-align: center }
.progress-content h3 { color: white; font-size: 1.25rem; margin-bottom: 0.5rem }
.progress-content p { color: #ccc; font-size: 0.875rem; margin-bottom: 1.5rem }
.progress-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.3s ease }
.progress-text { color: white; font-size: 0.875rem; font-weight: 500 }
</style>
