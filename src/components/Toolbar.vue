<template>
  <div class="toolbar">
    <button class="toolbar-btn" @click="$emit('undo')" title="Deshacer (Ctrl+Z)">
      <Undo2 class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('redo')" title="Rehacer (Ctrl+Alt+Z)">
      <Redo2 class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('addMedia')" title="Importar (Shift+A)">
      <Search class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('selectTool')" title="Seleccionar (A)">
      <MousePointer2 class="w-4 h-4" />
    </button>
    <div class="toolbar-group">
      <button class="toolbar-btn" :class="{ active: showAspectMenu }" @click="toggleAspectMenu" title="Aspecto">
        <Crop class="w-4 h-4" />
      </button>
      <div v-if="showAspectMenu" class="aspect-menu" @click.stop>
        <div v-for="opt in aspectOptions" :key="opt.value" class="aspect-item" :class="{ active: props.aspectRatio === opt.value }" @click="selectAspect(opt.value)">
          <span class="aspect-icon" v-html="opt.svg"></span>
          <span class="aspect-label">{{ opt.label }}</span>
        </div>
      </div>
    </div>
    <button class="toolbar-btn" @click="$emit('cut')" title="Cortar (X)">
      <Scissors class="w-4 h-4" />
    </button>
    <div class="toolbar-group">
      <button class="toolbar-btn" :class="{ active: showRotatePanel }" @click="toggleRotatePanel" title="Rotar">
        <RotateCw class="w-4 h-4" />
      </button>
      <div v-if="showRotatePanel" class="rotate-panel" @click.stop>
        <div class="rotate-row">
          <span class="rotate-label">Ángulo</span>
          <span class="rotate-value">{{ rotation }}°</span>
        </div>
        <input type="range" min="-180" max="180" v-model="rotation" :disabled="!props.selectedClip" class="rotate-slider" @input="onRotateInput" @change="onRotateChange" />
        <div class="rotate-buttons">
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setRotation(45)">45°</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setRotation(90)">90°</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setRotation(180)">180°</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setRotation(0)">0°</button>
        </div>
        <div class="rotate-row">
          <span class="rotate-label">Escala</span>
          <span class="rotate-value">{{ scale.toFixed(1) }}x</span>
        </div>
        <input type="range" min="0.1" max="3" step="0.1" v-model="scale" :disabled="!props.selectedClip" class="rotate-slider" @input="onScaleInput" @change="onScaleChange" />
        <div class="rotate-buttons">
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setScale(0.5)">0.5x</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setScale(1)">1x</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setScale(2)">2x</button>
          <button class="rotate-preset" :disabled="!props.selectedClip" @click="setScale(3)">3x</button>
        </div>
        <button class="rotate-preset mirror-btn" :disabled="!props.selectedClip" @click="$emit('flip')">
          <FlipHorizontal class="w-4 h-4" /> Mirror
        </button>
      </div>
    </div>
    <button class="toolbar-btn" @click="$emit('text')" title="Texto">
      <Type class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('speed')" title="Velocidad">
      <Gauge class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('recordAudio')" title="Grabar audio">
      <Mic class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('addAudio')" title="Agregar audio">
      <Music class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('flip')" title="Espejo (Mirror)">
      <FlipHorizontal class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('proxy')" title="Proxy">
      <Zap class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('process')" title="Procesar">
      <Cpu class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Undo2, Redo2, Search, MousePointer2, Scissors, Type, Gauge, Mic, Music, FlipHorizontal, Zap, Cpu, Crop, RotateCw } from 'lucide-vue-next'
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
const rotation = ref(0)
const scale = ref(1)

watch(() => props.selectedClip?.rotation, (v) => { rotation.value = v || 0 }, { immediate: true })
watch(() => (props.selectedClip as any)?.scale, (v) => { scale.value = v || 1 }, { immediate: true })

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

function onRotateInput() {
  emit('rotate', rotation.value)
}

function onRotateChange() {
  emit('rotateCommit', rotation.value)
}

function setRotation(angle: number) {
  rotation.value = angle
  emit('rotate', angle)
  emit('rotateCommit', angle)
}

function onScaleInput() {
  emit('scale', scale.value)
}

function onScaleChange() {
  emit('scaleCommit', scale.value)
}

function setScale(value: number) {
  scale.value = value
  emit('scale', value)
  emit('scaleCommit', value)
}

const aspectOptions = [
  { value: 'libre', label: 'Libre', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18M16 3v18M3 8h18M3 16h18"/></svg>' },
  { value: '1:1', label: '1:1', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5"/></svg>' },
  { value: '4:5', label: '4:5', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><rect x="5" y="2" width="14" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="11" r="3.5"/><circle cx="16.5" cy="6.5" r="1.2"/></svg>' },
  { value: '9:16', label: '9:16', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>' },
  { value: '16:9', label: '16:9', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C18.98 3.5 12 3.5 12 3.5s-6.98 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c2.4.55 9.38.55 9.38.55s6.98 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.55 15.5V8.5l6.27 3.5-6.27 3.5z"/></svg>' },
  { value: '4:3', label: '4:3', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.12 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>' },
  { value: '2:1', label: '2:1', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { value: '3:4', label: '3:4', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/></svg>' },
  { value: '3:2', label: '3:2', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/></svg>' },
  { value: '2:3', label: '2:3', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2"/></svg>' },
  { value: '1:2', label: '1:2', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="18" rx="2"/></svg>' },
  { value: '5:4', label: '5:4', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>' },
  { value: '21:9', label: '21:9', svg: '<svg viewBox="0 0 24 24" class="ratio-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="7.5" width="21" height="9" rx="2"/></svg>' }
]
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

.toolbar-group {
  position: relative;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #333;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #6366f1;
  transform: scale(1.05);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-btn.active {
  background: #6366f1;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.aspect-menu {
  position: absolute;
  top: 44px;
  left: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  z-index: 1000;
  min-width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.aspect-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 6px;
  color: white;
  font-size: 0.7rem;
  transition: background 0.2s;
}

.aspect-item:hover {
  background: #333;
}

.aspect-item.active {
  background: #6366f1;
}

.aspect-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aspect-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.rotate-panel {
  position: absolute;
  top: 44px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  z-index: 1000;
  min-width: 220px;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.rotate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #ccc;
}

.rotate-slider {
  width: 100%;
  accent-color: #6366f1;
}

.rotate-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rotate-preset {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.rotate-preset:hover {
  background: #6366f1;
}

.rotate-preset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mirror-btn {
  width: 100%;
}
</style>
