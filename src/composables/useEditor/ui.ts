import { onMounted, onUnmounted } from 'vue'
import type { BaseEditorState } from './state'
import type { VideoClip } from '../../stores/project'

export function useEditorUI(state: BaseEditorState) {
  let isResizing = false
  let startY = 0
  let startHeight = 0

  function goBack() {
    state.showExitConfirmation = true
  }

  function confirmExit() {
    state.projectStore.saveProjectToStorage()
    state.projectStore.setCurrentProject(null)
    state.showExitConfirmation = false
  }

  function cancelExit() {
    state.showExitConfirmation = false
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

  function handleSelectAll() {
    if (!state.currentProject) return
    const allClips = state.currentProject.tracks.flatMap(t => t.clips) as VideoClip[]
    state.setSelectedClips(allClips)
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
    confirmExit,
    cancelExit,
    saveProxySettings,
    startResize,
    onResize,
    stopResize,
    handleUndo,
    handleRedo,
    handleProxy,
    handleSelectAll
  }
}
