import { onMounted, onUnmounted } from 'vue'
import type { BaseEditorState } from './state'

export function useEditorUI(state: BaseEditorState) {
  let isResizing = false
  let startY = 0
  let startHeight = 0

  function goBack() {
    state.projectStore.saveProjectToStorage()
    state.projectStore.setCurrentProject(null)
  }

  function saveProxySettings(settings: any) {
    Object.assign(state.proxySettings, settings)
    state.showProxySettings = false
  }

  function startResize(e: MouseEvent) {
    e.preventDefault()
    isResizing = true
    startY = e.clientY
    startHeight = state.timelineHeight
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
  }

  function onResize(e: MouseEvent) {
    if (!isResizing) return
    const delta = e.clientY - startY
    state.timelineHeight = Math.max(150, Math.min(window.innerHeight - 200, startHeight + delta))
  }

  function stopResize() {
    isResizing = false
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
  }

  function handleUndo() {
    const id = state.selectedClip?.id
    state.projectStore.undo()
    state.syncSelectedClip(id)
  }

  function handleRedo() {
    const id = state.selectedClip?.id
    state.projectStore.redo()
    state.syncSelectedClip(id)
  }

  function handleProxy() {
    state.showProxySettings = true
  }

  onMounted(() => {
    if (state.isElectron() && typeof window.electronAPI.onConversionProgress === 'function') {
      state.cleanupConversionProgress = window.electronAPI.onConversionProgress((data) => {
        state.conversionProgress = data.progress
        state.conversionMessage = data.message
      })
    }
  })

  onUnmounted(() => {
    if (typeof state.cleanupConversionProgress === 'function') state.cleanupConversionProgress()
    stopResize()
  })

  return {
    goBack,
    saveProxySettings,
    startResize,
    onResize,
    stopResize,
    handleUndo,
    handleRedo,
    handleProxy
  }
}
