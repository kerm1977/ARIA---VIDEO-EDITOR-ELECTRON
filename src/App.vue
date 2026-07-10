<template>
  <div id="app" class="min-h-screen bg-video-darker text-white">
    <ProjectGrid v-if="!projectStore.hasProject" />
    <Editor v-else />
    <DebugConsole />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useProjectStore } from './stores/project'
import { useSystemPerformance } from './hooks/useSystemPerformance'
import ProjectGrid from './components/ProjectGrid.vue'
import Editor from './components/Editor.vue'
import DebugConsole from './components/DebugConsole.vue'

const projectStore = useProjectStore()
const { detectPerformance } = useSystemPerformance()

onMounted(async () => {
  detectPerformance()

  // Load saved project data
  await projectStore.loadProjectFromStorage()

  // Start auto-save every 30 seconds
  projectStore.startAutoSave(30000)
})

onUnmounted(() => {
  // Stop auto-save and save final state
  projectStore.stopAutoSave()
  projectStore.saveProjectToStorage()
})
</script>

<style>
#app {
  font-family: 'Inter', system-ui, sans-serif;
}
</style>
