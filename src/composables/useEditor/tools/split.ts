import type { BaseEditorState } from '../state'

export function useSplitTool(state: BaseEditorState) {
  function handleSplitClip(clipId: string, splitTime: number) {
    if (!state.projectStore.currentProject || !clipId || splitTime < 0) return
    const newClip = state.projectStore.splitClip(clipId, splitTime)
    if (newClip) state.setSelectedClips([newClip])
  }

  return { handleSplitClip }
}
