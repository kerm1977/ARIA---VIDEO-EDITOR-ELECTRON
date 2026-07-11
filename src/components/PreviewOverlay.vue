<template>
  <div>
    <div v-if="(currentTool || activeTool) && info" class="transform-overlay">{{ info }}</div>
    <div v-if="showMenu" class="context-menu" :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }" @click="showMenu = false">
      <div class="context-menu-item"><span>Resolution:</span><span>{{ clip?.metadata.width }}x{{ clip?.metadata.height }}</span></div>
      <div class="context-menu-item"><span>FPS:</span><span>{{ clip?.metadata.fps.toFixed(2) }}</span></div>
      <div class="context-menu-item"><span>Codec:</span><span>{{ clip?.metadata.codec }}</span></div>
      <div class="context-menu-item"><span>Duration:</span><span>{{ formatDuration(clip?.metadata.duration || 0) }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDuration } from '../utils/video'
import type { VideoClip } from '../stores/project'

defineProps<{
  clip?: VideoClip | null
  currentTool?: 'rotate' | 'scale' | 'move' | null
  activeTool?: 'rotate' | 'scale' | 'move' | null
  info?: string
  showMenu?: boolean
  menuPosition?: { x: number; y: number }
}>()
</script>

<style scoped>
.transform-overlay { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-family: monospace; pointer-events: none; z-index: 10; border: 1px solid rgba(255,255,255,0.2) }
.context-menu { position: fixed; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 0.5rem; z-index: 1000; min-width: 200px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) }
.context-menu-item { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #ccc; border-radius: 4px }
.context-menu-item:hover { background: #333 }
.context-menu-item span:first-child { color: #888 }
.context-menu-item span:last-child { color: #fff; font-weight: 500 }
</style>
