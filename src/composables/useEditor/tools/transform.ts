import type { BaseEditorState } from '../state'

export function useTransformTool(state: BaseEditorState) {
  function handleRotate(angle: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipRotation === 'function') {
      state.projectStore.setClipRotation(state.selectedClip.id, angle, false)
    } else {
      (state.selectedClip as any).rotation = angle
    }
  }

  function handleRotateCommit(angle: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipRotation === 'function') {
      state.projectStore.setClipRotation(state.selectedClip.id, angle, true)
      state.projectStore.pushHistory()
    } else {
      (state.selectedClip as any).rotation = angle
      const project = state.projectStore.currentProject
      if (project) project.modified_at = new Date().toISOString()
      state.projectStore.pushHistory()
      state.projectStore.saveProjectToStorage()
    }
  }

  function handleScale(scale: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipScale === 'function') {
      state.projectStore.setClipScale(state.selectedClip.id, scale, false)
    } else {
      (state.selectedClip as any).scale = scale
    }
  }

  function handleScaleCommit(scale: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipScale === 'function') {
      state.projectStore.setClipScale(state.selectedClip.id, scale, true)
      state.projectStore.pushHistory()
    } else {
      (state.selectedClip as any).scale = scale
      const project = state.projectStore.currentProject
      if (project) project.modified_at = new Date().toISOString()
      state.projectStore.pushHistory()
      state.projectStore.saveProjectToStorage()
    }
  }

  function handlePosition(x: number, y: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipPosition === 'function') {
      state.projectStore.setClipPosition(state.selectedClip.id, x, y, false)
    } else {
      (state.selectedClip as any).positionX = x
      (state.selectedClip as any).positionY = y
    }
  }

  function handlePositionCommit(x: number, y: number) {
    if (!state.selectedClip) return
    if (typeof state.projectStore.setClipPosition === 'function') {
      state.projectStore.setClipPosition(state.selectedClip.id, x, y, true)
      state.projectStore.pushHistory()
    } else {
      (state.selectedClip as any).positionX = x
      (state.selectedClip as any).positionY = y
      const project = state.projectStore.currentProject
      if (project) project.modified_at = new Date().toISOString()
      state.projectStore.pushHistory()
      state.projectStore.saveProjectToStorage()
    }
  }

  function handleFlip() {
    if (!state.selectedClip) return
    state.projectStore.setClipMirror(state.selectedClip.id)
    state.projectStore.pushHistory()
  }

  return {
    handleRotate,
    handleRotateCommit,
    handleScale,
    handleScaleCommit,
    handlePosition,
    handlePositionCommit,
    handleFlip
  }
}
