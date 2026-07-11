<template>
  <div v-if="props.visible" class="context-menu" :style="{ left: props.x + 'px', top: props.y + 'px' }" @click="emit('close')">
    <div class="context-menu-item" @click="emit('cut')">Cortar</div>
    <div class="context-menu-item" @click="emit('info')">Información</div>
    <div class="context-menu-item" @click="emit('go-to')">Ir a ubicación de archivo</div>
    <div class="context-menu-item" @click="emit('proxy')">Crear proxy</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ visible: boolean; x: number; y: number }>()
const emit = defineEmits<{ cut: []; info: []; 'go-to': []; proxy: []; close: [] }>()
</script>

<style scoped>
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); z-index: 1000; min-width: 200px; overflow: hidden }
.context-menu-item { padding: 0.75rem 1rem; cursor: pointer; transition: background 0.2s; color: #ccc; font-size: 0.875rem }
.context-menu-item:hover { background: #6366f1; color: white }
</style>
