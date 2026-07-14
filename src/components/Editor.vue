<template>
  <div class="editor">
    <header class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack"><ArrowLeft class="w-5 h-5" /></button>
        <h1 class="project-title">{{ state.currentProject?.name || 'Sin título' }}</h1>
      </div>
      <div class="header-center">
        <button class="header-btn" @click="importVideo"><Upload class="w-5 h-5" />Importar</button>
        <button class="header-btn" @click="exportProject"><Download class="w-5 h-5" />Exportar</button>
      </div>
      <div class="header-right">
        <button class="header-btn" @click="state.showProxySettings = true"><Settings class="w-5 h-5" /></button>
      </div>
    </header>
    <div class="editor-content">
      <main class="main-panel">
        <VideoPreview :ref="(el) => { state.videoPreview = el as any }" :current-clip="state.previewClip" :selected-clip="state.selectedClip" :current-time="state.currentTime" :is-playing="state.isPlaying" :aspect-ratio="state.currentProject?.aspectRatio || 'libre'" :active-tool="state.activeTool" @timeUpdate="handleTimeUpdate" @playStateChange="handlePlayStateChange" @rotate="handleRotate" @rotateCommit="handleRotateCommit" @scale="handleScale" @scaleCommit="handleScaleCommit" @position="handlePosition" @positionCommit="handlePositionCommit" @zoomTimeline="handleZoomTimeline" />
      </main>
    </div>
    <Toolbar
      :aspect-ratio="state.currentProject?.aspectRatio || 'libre'"
      :selected-clip="state.selectedClip"
      @undo="handleUndo"
      @redo="handleRedo"
      @addMedia="importVideo"
      @selectTool="handleSelect"
      @cut="handleCutClip"
      @aspectRatio="handleAspectRatio"
      @rotate="handleRotate"
      @rotateCommit="handleRotateCommit"
      @scale="handleScale"
      @scaleCommit="handleScaleCommit"
      @text="handleText"
      @speed="handleSpeed"
      @recordAudio="handleRecordAudio"
      @addAudio="handleGuitar"
      @flip="handleFlip"
      @proxy="handleProxy"
      @process="handleProcess"
    />
    <div class="panel-resizer" @mousedown="startResize" title="Arrastrar para redimensionar"></div>
    <div class="timeline-panel" :style="{ height: state.timelineHeight + 'px' }">
      <Timeline :tracks="state.currentProject?.tracks || []" :duration="state.currentProject?.duration || 0" :currentTime="state.currentTime" :isPlaying="state.isPlaying" :selected-clips="state.selectedClips" :timeline-zoom="state.timelineZoom" @add-clip="state.showImportModal = true" @select-clips="handleSelectClips" @timeUpdate="handleTimelineTimeUpdate" @cutClip="handleCutClip" @move-clip="handleMoveClip" @split-clip="handleSplitClip" @addMedia="state.showImportModal = true" />
    </div>
    <ProxySettingsModal v-if="state.showProxySettings" :settings="state.proxySettings" @close="state.showProxySettings = false" @save="saveProxySettings" />
    <ImportModal v-if="state.showImportModal" @close="state.showImportModal = false" @import="handleImport" />
    <ExportModal v-if="state.showExportModal" @close="state.showExportModal = false" @export="handleExport" />
    <ExitConfirmationModal v-if="state.showExitConfirmation" @cancel="cancelExit" @confirm="confirmExit" />
    <div v-if="state.isConverting" class="conversion-progress">
      <div class="progress-overlay">
        <div class="progress-content">
          <h3>Convirtiendo Video</h3>
          <p>{{ state.conversionMessage }}</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: state.conversionProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.round(state.conversionProgress) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Upload, Download, Settings } from 'lucide-vue-next'
import { useEditor } from '../composables/useEditor'
import VideoPreview from './VideoPreview.vue'
import Timeline from './Timeline.vue'
import Toolbar from './Toolbar.vue'
import ProxySettingsModal from './ProxySettingsModal.vue'
import ImportModal from './ImportModal.vue'
import ExportModal from './ExportModal.vue'
import ExitConfirmationModal from './ExitConfirmationModal.vue'

const {
  state,
  importVideo,
  exportProject,
  handleExport,
  handleGuitar,
  handleImport,
  goBack,
  confirmExit,
  cancelExit,
  saveProxySettings,
  startResize,
  handleUndo,
  handleRedo,
  handleProxy,
  handleCutClip,
  handleSplitClip,
  handleMoveClip,
  handleSelect,
  handleSelectClips,
  handleTimeUpdate,
  handlePlayStateChange,
  handleTimelineTimeUpdate,
  handleRotate,
  handleRotateCommit,
  handleScale,
  handleScaleCommit,
  handlePosition,
  handlePositionCommit,
  handleFlip,
  handleText,
  handleSpeed,
  handleRecordAudio,
  handleProcess,
  handleAspectRatio
} = useEditor()

function handleZoomTimeline(delta: number) {
  const oldZoom = state.timelineZoom
  state.timelineZoom = Math.max(0.1, Math.min(10, state.timelineZoom + delta * 0.002))
  const newZoom = state.timelineZoom
  const zoomRatio = newZoom / oldZoom
  state.timelineScroll = (state.timelineScroll * zoomRatio)
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
.main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 200px; background: #000 }
.panel-resizer { height: 6px; background: #1a1a1a; border-top: 1px solid #333; border-bottom: 1px solid #333; cursor: row-resize; flex-shrink: 0; transition: background 0.2s }
.panel-resizer:hover { background: #6366f1 }
.timeline-panel { border-top: 1px solid #333; flex-shrink: 0; width: 100%; min-height: 150px; overflow: hidden }
.conversion-progress { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.progress-overlay { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center }
.progress-content { background: #1a1a1a; padding: 2rem; border-radius: 12px; border: 1px solid #333; min-width: 400px; text-align: center }
.progress-content h3 { color: white; font-size: 1.25rem; margin-bottom: 0.5rem }
.progress-content p { color: #ccc; font-size: 0.875rem; margin-bottom: 1.5rem }
.progress-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.3s ease }
.progress-text { color: white; font-size: 0.875rem; font-weight: 500 }
</style>
