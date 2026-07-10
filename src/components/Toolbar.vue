<template>
  <div class="toolbar">
    <button class="toolbar-btn" @click="$emit('addMedia')" title="Add Media">
      <Search class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('cut')" title="Cut (X)">
      <Scissors class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('text')" title="Add Text">
      <Type class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('speed')" title="Speed">
      <Gauge class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('recordAudio')" title="Record Audio">
      <Mic class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('addAudio')" title="Add Audio">
      <Music class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('flip')" title="Flip">
      <FlipHorizontal class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('proxy')" title="Proxy">
      <Zap class="w-4 h-4" />
    </button>
    <button class="toolbar-btn" @click="$emit('process')" title="Process">
      <Cpu class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Scissors, Type, Gauge, Mic, Music, FlipHorizontal, Zap, Cpu, Search } from 'lucide-vue-next'

defineEmits<{
  addMedia: []
  cut: []
  text: []
  speed: []
  recordAudio: []
  addAudio: []
  flip: []
  proxy: []
  process: []
}>()
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
</style>
