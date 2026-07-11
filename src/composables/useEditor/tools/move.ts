import type { BaseEditorState } from '../state'

export function useMoveTool(state: BaseEditorState) {
  function handleMoveClip(clipId: string, newStart: number) {
    if (!state.projectStore.currentProject || !clipId || newStart < 0) return
    state.projectStore.moveClip(clipId, newStart)
    state.syncSelectedClip(clipId)
  }

  return { handleMoveClip }
}
