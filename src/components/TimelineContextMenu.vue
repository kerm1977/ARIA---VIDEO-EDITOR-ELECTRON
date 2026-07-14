<template>
  <div v-if="props.visible" ref="menuRef" class="context-menu" :style="{ left: props.x + 'px', top: props.y + 'px' }" @click.stop>
    <div class="context-menu-item" @click="emit('cut')">Cortar</div>
    <div class="context-menu-item" @click="emit('select-all-track')">Seleccionar todos en esta fila</div>
    <div class="context-menu-item" @click="emit('info')">Información</div>
    <div class="context-menu-item" @click="emit('go-to')">Ir a ubicación de archivo</div>
    <div class="context-menu-item" @click="emit('proxy')">Crear proxy</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{ visible: boolean; x: number; y: number }>()
const emit = defineEmits<{ cut: []; 'select-all-track': []; info: []; 'go-to': []; proxy: []; close: [] }>()

const menuRef = ref<HTMLElement | null>(null)

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); z-index: 1000; min-width: 200px; overflow: hidden }
.context-menu-item { padding: 0.75rem 1rem; cursor: pointer; transition: background 0.2s; color: #ccc; font-size: 0.875rem }
.context-menu-item:hover { background: #6366f1; color: white }
</style>
