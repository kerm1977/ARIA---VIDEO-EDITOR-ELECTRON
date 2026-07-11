import { onMounted } from 'vue'
import type { BaseEditorState } from './state'
import type { VideoClip } from '../../stores/project'

export function useEditorSelection(state: BaseEditorState) {
  function handleSelectClips(clips: VideoClip[]) {
    state.setSelectedClips(clips)
  }

  function handleSelect() {
    const project = state.projectStore.currentProject
    if (!project) return
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        if (state.currentTime >= clip.start_time && state.currentTime < clip.end_time) {
          state.setSelectedClips([clip as VideoClip])
          return
        }
      }
    }
    for (const track of project.tracks) {
      if (track.clips.length > 0) {
        state.setSelectedClips([track.clips[0] as VideoClip])
        return
      }
    }
  }

  onMounted(() => {
    if (!state.selectedClip && state.currentProject) {
      for (const track of state.currentProject.tracks) {
        if (track.clips.length > 0) {
          state.setSelectedClips([track.clips[0] as VideoClip])
          break
        }
      }
    }
  })

  return { handleSelectClips, handleSelect }
}
