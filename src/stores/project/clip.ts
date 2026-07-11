import type { ProjectState, VideoClip } from './types'
import { updateProjectDuration, syncProjectList, saveProjectToStorage } from './core'

export async function addClipToTrack(state: ProjectState, pushHistory: () => void, trackId: string, clip: VideoClip | any) {
  if (!state.currentProject.value) return
  try {
    state.isLoading.value = true
    state.error.value = null
    const updatedProject = { ...state.currentProject.value }
    const track = updatedProject.tracks.find(t => t.id === trackId)
    if (track) {
      track.clips.push(clip)
      let maxEnd = 0
      updatedProject.tracks.forEach(t => t.clips.forEach(c => { if (c.end_time > maxEnd) maxEnd = c.end_time }))
      updatedProject.duration = maxEnd
      updatedProject.modified_at = new Date().toISOString()
    }
    state.currentProject.value = updatedProject
    const projectIndex = state.projects.value.findIndex(p => p.id === updatedProject.id)
    if (projectIndex !== -1) state.projects.value[projectIndex] = updatedProject
    await saveProjectToStorage(state)
    pushHistory()
  } catch (e) {
    state.error.value = e as string
    throw e
  } finally {
    state.isLoading.value = false
  }
}

export async function deleteClip(state: ProjectState, pushHistory: () => void, clipId: string) {
  if (!state.currentProject.value) return
  for (const track of state.currentProject.value.tracks) {
    const idx = track.clips.findIndex(c => c.id === clipId)
    if (idx !== -1) {
      track.clips.splice(idx, 1)
      break
    }
  }
  updateProjectDuration(state)
  state.currentProject.value.modified_at = new Date().toISOString()
  await saveProjectToStorage(state)
  pushHistory()
}

export function splitClip(state: ProjectState, pushHistory: () => void, clipId: string, splitTime: number): VideoClip | null {
  if (!state.currentProject.value) return null
  for (const track of state.currentProject.value.tracks) {
    const idx = track.clips.findIndex(c => c.id === clipId)
    if (idx === -1) continue
    const clip = track.clips[idx] as VideoClip
    if (splitTime <= clip.start_time + 0.1 || splitTime >= clip.end_time - 0.1) return null
    const length = clip.end_time - clip.start_time
    const sourceLength = clip.out_point - clip.in_point
    const ratio = sourceLength > 0 ? (splitTime - clip.start_time) / length : 0
    const sourceSplit = clip.in_point + sourceLength * ratio
    const firstPart = { ...clip, id: crypto.randomUUID(), end_time: splitTime, out_point: sourceSplit } as VideoClip
    const secondPart = { ...clip, id: crypto.randomUUID(), start_time: splitTime, in_point: sourceSplit } as VideoClip
    track.clips.splice(idx, 1, firstPart, secondPart)
    updateProjectDuration(state)
    state.currentProject.value.modified_at = new Date().toISOString()
    syncProjectList(state)
    saveProjectToStorage(state)
    pushHistory()
    return secondPart
  }
  return null
}

export function moveClip(state: ProjectState, pushHistory: () => void, clipId: string, newStart: number) {
  if (!state.currentProject.value) return
  const clip = state.currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as VideoClip | undefined
  if (!clip) return
  const length = clip.out_point - clip.in_point
  const start = Math.max(0, newStart)
  clip.start_time = start
  clip.end_time = start + length
  updateProjectDuration(state)
  state.currentProject.value.modified_at = new Date().toISOString()
  syncProjectList(state)
  saveProjectToStorage(state)
  pushHistory()
}

export function cutAndDelete(state: ProjectState, pushHistory: () => void, clipId: string, cutTime: number): VideoClip | null {
  if (!state.currentProject.value) return null
  for (const track of state.currentProject.value.tracks) {
    const idx = track.clips.findIndex(c => c.id === clipId)
    if (idx === -1) continue
    const clip = track.clips[idx] as VideoClip
    let firstPart: VideoClip | null = null
    if (cutTime <= clip.start_time + 0.1) {
      track.clips.splice(idx, 1)
    } else if (cutTime >= clip.end_time - 0.1) {
      const length = clip.end_time - clip.start_time
      const sourceLength = clip.out_point - clip.in_point
      const ratio = sourceLength > 0 && length > 0 ? (cutTime - clip.start_time) / length : 0
      clip.end_time = cutTime
      clip.out_point = clip.in_point + sourceLength * ratio
      firstPart = clip
    } else {
      const length = clip.end_time - clip.start_time
      const sourceLength = clip.out_point - clip.in_point
      const ratio = sourceLength > 0 && length > 0 ? (cutTime - clip.start_time) / length : 0
      const sourceSplit = clip.in_point + sourceLength * ratio
      firstPart = { ...clip, end_time: cutTime, out_point: sourceSplit } as VideoClip
      track.clips.splice(idx, 1, firstPart)
    }
    updateProjectDuration(state)
    state.currentProject.value.modified_at = new Date().toISOString()
    syncProjectList(state)
    saveProjectToStorage(state)
    pushHistory()
    return firstPart
  }
  return null
}

export function closeGap(state: ProjectState, pushHistory: () => void, time: number) {
  if (!state.currentProject.value) return
  let changed = false
  for (const track of state.currentProject.value.tracks) {
    const sorted = [...track.clips].sort((a, b) => a.start_time - b.start_time)
    let gapStart = 0
    let gapEnd = 0
    let gapIndex = -1
    for (let i = 0; i < sorted.length; i++) {
      const clip = sorted[i]
      if (time >= gapStart && time < clip.start_time) {
        gapEnd = clip.start_time
        gapIndex = i
        break
      }
      gapStart = clip.end_time
    }
    if (gapIndex === -1) continue
    const gapDuration = gapEnd - gapStart
    if (gapDuration <= 0) continue
    for (let i = gapIndex; i < sorted.length; i++) {
      const clip = sorted[i]
      clip.start_time -= gapDuration
      clip.end_time -= gapDuration
    }
    changed = true
  }
  if (!changed) return
  updateProjectDuration(state)
  state.currentProject.value.modified_at = new Date().toISOString()
  syncProjectList(state)
  saveProjectToStorage(state)
  pushHistory()
}
