import { onMounted, onUnmounted } from 'vue'
import type { BaseEditorState } from './state'

export interface ToolActions {
  handleUndo: () => void
  handleRedo: () => void
  handleSelect: () => void
  handleSelectAll: () => void
  handleTogglePlay: () => void
  handleCutClip: () => void
  handleCloseGap: () => void
  handleRemoveAllGaps: () => void
  handleCutAndDelete: () => void
  handleDeleteSelected: () => void
  handleImportVideo: () => void
  handleFlip: () => void
  handleRotate: (angle: number) => void
  handleRotateCommit: (angle: number) => void
  handleScale: (scale: number) => void
  handleScaleCommit: (scale: number) => void
  handlePosition: (x: number, y: number) => void
  handlePositionCommit: (x: number, y: number) => void
  handleText: () => void
  handleSpeed: () => void
  handleRecordAudio: () => void
  handleGuitar: () => void
  handleProcess: () => void
  handleAspectRatio: (ratio: string) => void
  handleProxy: () => void
  handleMoveClip: (clipId: string, newStart: number) => void
  handleSplitClip: (clipId: string, splitTime: number) => void
}

export function useEditorShortcuts(state: BaseEditorState, actions: ToolActions) {
  function onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return

    if (e.ctrlKey && e.altKey && e.code === 'KeyZ') {
      e.preventDefault(); actions.handleRedo(); return
    }
    if (e.ctrlKey && e.code === 'KeyZ') {
      e.preventDefault(); actions.handleUndo(); return
    }
    if (e.shiftKey && e.code === 'KeyA') {
      e.preventDefault(); actions.handleImportVideo(); return
    }
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'KeyA') {
      e.preventDefault(); actions.handleSelect(); return
    }
    if (e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'KeyA') {
      e.preventDefault(); actions.handleSelectAll(); return
    }
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'Space') {
      e.preventDefault(); actions.handleTogglePlay(); return
    }
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'KeyX') {
      e.preventDefault(); actions.handleCutClip(); return
    }
    if (!e.ctrlKey && !e.altKey && e.shiftKey && e.code === 'KeyW') {
      e.preventDefault(); actions.handleCloseGap(); return
    }
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'KeyW') {
      e.preventDefault(); actions.handleRemoveAllGaps(); return
    }
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && e.code === 'KeyD') {
      e.preventDefault(); actions.handleDeleteSelected(); return
    }
    if (e.code === 'KeyR' && !e.altKey && (!e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); state.activeTool = 'rotate'; return
    }
    if (e.code === 'KeyS' && !e.altKey && (!e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); state.activeTool = 'scale'; return
    }
    if (e.code === 'KeyG' && !e.altKey && (!e.ctrlKey || e.shiftKey)) {
      e.preventDefault(); state.activeTool = 'move'; return
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'KeyR' && state.activeTool === 'rotate') state.activeTool = null
    if (e.code === 'KeyS' && state.activeTool === 'scale') state.activeTool = null
    if (e.code === 'KeyG' && state.activeTool === 'move') state.activeTool = null
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  })

  return { onKeyDown, onKeyUp }
}
