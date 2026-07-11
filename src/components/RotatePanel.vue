<template>
  <div class="rotate-panel" @click.stop>
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
    <button class="rotate-preset mirror-btn" :disabled="!props.selectedClip" @click="emit('flip')">
      <FlipHorizontal class="w-4 h-4" /> Mirror
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FlipHorizontal } from 'lucide-vue-next'
import type { VideoClip } from '../stores/project'

const props = defineProps<{ selectedClip?: VideoClip | null }>()
const emit = defineEmits<{
  rotate: [angle: number]
  rotateCommit: [angle: number]
  scale: [scale: number]
  scaleCommit: [scale: number]
  flip: []
}>()

const rotation = ref(0)
const scale = ref(1)

watch(() => props.selectedClip?.rotation, (v) => { rotation.value = v || 0 }, { immediate: true })
watch(() => (props.selectedClip as any)?.scale, (v) => { scale.value = v || 1 }, { immediate: true })

function onRotateInput() { emit('rotate', rotation.value) }
function onRotateChange() { emit('rotateCommit', rotation.value) }
function onScaleInput() { emit('scale', scale.value) }
function onScaleChange() { emit('scaleCommit', scale.value) }

function setRotation(angle: number) {
  rotation.value = angle
  emit('rotate', angle)
  emit('rotateCommit', angle)
}

function setScale(value: number) {
  scale.value = value
  emit('scale', value)
  emit('scaleCommit', value)
}
</script>

<style scoped>
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
.rotate-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: #ccc }
.rotate-slider { width: 100%; accent-color: #6366f1 }
.rotate-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap }
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
.rotate-preset:hover { background: #6366f1 }
.rotate-preset:disabled { opacity: 0.4; cursor: not-allowed }
.mirror-btn { width: 100% }
</style>
