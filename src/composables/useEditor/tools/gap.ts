import type { BaseEditorState } from '../state'

export function useGapTool(state: BaseEditorState) {
  function handleCloseGap() {
    if (!state.projectStore.currentProject) return
    state.projectStore.closeGap(state.currentTime)
  }

  return { handleCloseGap }
}
