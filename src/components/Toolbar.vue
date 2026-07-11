<template>
  <div class="toolbar">
    <ToolButton :icon="Undo2" title="Deshacer (Ctrl+Z)" @click="emit('undo')" />
    <ToolButton :icon="Redo2" title="Rehacer (Ctrl+Alt+Z)" @click="emit('redo')" />
    <ToolButton :icon="Search" title="Importar (Shift+A)" @click="emit('addMedia')" />
    <ToolButton :icon="MousePointer2" title="Seleccionar (A)" @click="emit('selectTool')" />
    <div class="toolbar-group">
      <ToolButton :icon="Crop" title="Aspecto" :active="showAspectMenu" @click="toggleAspectMenu" />
      <AspectMenu v-if="showAspectMenu" :aspect-ratio="props.aspectRatio" @select="selectAspect" />
    </div>
    <ToolButton :icon="Scissors" title="Cortar (X)" @click="emit('cut')" />
    <div class="toolbar-group">
      <ToolButton :icon="RotateCw" title="Rotar" :active="showRotatePanel" @click="toggleRotatePanel" />
      <RotatePanel v-if="showRotatePanel" :selected-clip="props.selectedClip" @rotate="emit('rotate', $event)" @rotateCommit="emit('rotateCommit', $event)" @scale="emit('scale', $event)" @scaleCommit="emit('scaleCommit', $event)" @flip="emit('flip')" />
    </div>
    <ToolButton :icon="Type" title="Texto" @click="emit('text')" />
    <ToolButton :icon="Gauge" title="Velocidad" @click="emit('speed')" />
    <ToolButton :icon="Mic" title="Grabar audio" @click="emit('recordAudio')" />
    <ToolButton :icon="Music" title="Agregar audio" @click="emit('addAudio')" />
    <ToolButton :icon="FlipHorizontal" title="Espejo (Mirror)" @click="emit('flip')" />
    <ToolButton :icon="Zap" title="Proxy" @click="emit('proxy')" />
    <ToolButton :icon="Cpu" title="Procesar" @click="emit('process')" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Undo2, Redo2, Search, MousePointer2, Scissors, Type, Gauge, Mic, Music, FlipHorizontal, Zap, Cpu, Crop, RotateCw } from 'lucide-vue-next'
import ToolButton from './ToolButton.vue'
import AspectMenu from './AspectMenu.vue'
import RotatePanel from './RotatePanel.vue'
import type { VideoClip } from '../stores/project'

const props = defineProps<{
  aspectRatio?: string
  selectedClip?: VideoClip | null
}>()

const emit = defineEmits<{
  undo: []
  redo: []
  addMedia: []
  selectTool: []
  cut: []
  text: []
  speed: []
  recordAudio: []
  addAudio: []
  flip: []
  proxy: []
  process: []
  aspectRatio: [ratio: string]
  rotate: [angle: number]
  rotateCommit: [angle: number]
  scale: [scale: number]
  scaleCommit: [scale: number]
}>()

const showAspectMenu = ref(false)
const showRotatePanel = ref(false)

function toggleAspectMenu() {
  showAspectMenu.value = !showAspectMenu.value
  showRotatePanel.value = false
}

function selectAspect(ratio: string) {
  showAspectMenu.value = false
  emit('aspectRatio', ratio)
}

function toggleRotatePanel() {
  showRotatePanel.value = !showRotatePanel.value
  showAspectMenu.value = false
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  height: 40px;
  position: relative;
  flex-shrink: 0;
}
.toolbar-group { position: relative }
</style>
