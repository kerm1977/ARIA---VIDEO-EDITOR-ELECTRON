import type { BaseEditorState } from '../state'
import type { VideoClip } from '../../../stores/project'

export function useCutTool(state: BaseEditorState) {
  function handleCutClip() {
    const project = state.projectStore.currentProject
    if (!project) return
    const cutTime = state.currentTime
    const clip = project.tracks.flatMap(t => t.clips).find(c => c.start_time <= cutTime && c.end_time >= cutTime) as VideoClip | undefined
    if (!clip) return
    const newClip = state.projectStore.splitClip(clip.id, cutTime)
    if (newClip) state.setSelectedClips([newClip])
  }

  return { handleCutClip }
}
