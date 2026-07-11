import type { BaseEditorState } from '../state'

export function useDeleteTool(state: BaseEditorState) {
  function handleCutAndDelete() {
    const project = state.projectStore.currentProject
    if (!project) return
    const cutTime = state.currentTime
    const clip = project.tracks.flatMap(t => t.clips).find(c => c.start_time <= cutTime && c.end_time >= cutTime)
    if (!clip) return
    const leftPart = state.projectStore.cutAndDelete(clip.id, cutTime)
    if (leftPart) state.setSelectedClips([leftPart])
    else state.setSelectedClips([])
  }

  function handleDeleteSelected() {
    if (!state.selectedClip) return
    state.projectStore.deleteClip(state.selectedClip.id)
    state.setSelectedClips([])
  }

  return { handleCutAndDelete, handleDeleteSelected }
}
