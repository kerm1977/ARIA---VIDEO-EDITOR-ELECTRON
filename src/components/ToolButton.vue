<template>
  <button class="toolbar-btn" :class="{ active: props.active }" :disabled="props.disabled" :title="props.title" @click="emit('click')">
    <component :is="props.icon" class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  icon: Component
  title?: string
  active?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
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
.toolbar-btn:hover { background: #6366f1; transform: scale(1.05) }
.toolbar-btn:active { transform: scale(0.95) }
.toolbar-btn.active { background: #6366f1 }
.toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed }
</style>
