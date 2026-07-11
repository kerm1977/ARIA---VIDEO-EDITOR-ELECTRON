import type { ProjectState } from './types'

export function syncProjectList(state: ProjectState) {
  if (!state.currentProject.value) return
  const projectIndex = state.projects.value.findIndex(p => p.id === state.currentProject.value!.id)
  if (projectIndex !== -1) state.projects.value[projectIndex] = state.currentProject.value
}

export function updateProjectDuration(state: ProjectState) {
  if (!state.currentProject.value) return
  let maxEnd = 0
  state.currentProject.value.tracks.forEach(t => {
    t.clips.forEach(c => {
      if (c.end_time > maxEnd) maxEnd = c.end_time
    })
  })
  state.currentProject.value.duration = maxEnd
  syncProjectList(state)
}

export async function saveProjectToStorage(state: ProjectState) {
  try {
    const data = JSON.stringify({
      currentProject: state.currentProject.value,
      projects: state.projects.value,
      proxySettings: state.proxySettings.value
    })

    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.saveProjectData(data)
    } else {
      localStorage.setItem('aria-video-editor-data', data)
    }
  } catch (e) {
    console.error('Failed to save project:', e)
  }
}

export function setProjectAspectRatio(state: ProjectState, pushHistory: () => void, ratio: string) {
  if (!state.currentProject.value) return
  state.currentProject.value.aspectRatio = ratio
  state.currentProject.value.modified_at = new Date().toISOString()
  syncProjectList(state)
  saveProjectToStorage(state)
  pushHistory()
}
