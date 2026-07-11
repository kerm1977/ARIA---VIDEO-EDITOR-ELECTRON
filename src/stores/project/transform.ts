import type { ProjectState } from './types'
import { saveProjectToStorage } from './core'

function findClip(state: ProjectState, clipId: string): any | null {
  if (!state.currentProject.value) return null
  return state.currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
}

function syncProjectClip(state: ProjectState, clipId: string, updater: (c: any) => void) {
  const projectIndex = state.projects.value.findIndex(p => p.id === state.currentProject.value!.id)
  if (projectIndex !== -1) {
    const pClip = state.projects.value[projectIndex].tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
    if (pClip) updater(pClip)
  }
}

function clampRotation(angle: number) {
  return Math.max(-360, Math.min(360, angle))
}

function clampScale(scale: number) {
  return Math.max(0.1, Math.min(5, scale))
}

function clampPosition(value: number) {
  return Math.max(-2000, Math.min(2000, value))
}

export function setClipRotation(state: ProjectState, clipId: string, angle: number, persist = true) {
  const clip = findClip(state, clipId)
  if (!clip) return
  const value = clampRotation(angle)
  clip.rotation = value
  syncProjectClip(state, clipId, c => { c.rotation = value })
  if (persist && state.currentProject.value) {
    state.currentProject.value.modified_at = new Date().toISOString()
    saveProjectToStorage(state)
  }
}

export function setClipScale(state: ProjectState, clipId: string, scale: number, persist = true) {
  const clip = findClip(state, clipId)
  if (!clip) return
  const value = clampScale(scale)
  clip.scale = value
  syncProjectClip(state, clipId, c => { c.scale = value })
  if (persist && state.currentProject.value) {
    state.currentProject.value.modified_at = new Date().toISOString()
    saveProjectToStorage(state)
  }
}

export function setClipPosition(state: ProjectState, clipId: string, x: number, y: number, persist = true) {
  const clip = findClip(state, clipId)
  if (!clip) return
  const posX = clampPosition(x)
  const posY = clampPosition(y)
  clip.positionX = posX
  clip.positionY = posY
  syncProjectClip(state, clipId, c => { c.positionX = posX; c.positionY = posY })
  if (persist && state.currentProject.value) {
    state.currentProject.value.modified_at = new Date().toISOString()
    saveProjectToStorage(state)
  }
}

export function setClipMirror(state: ProjectState, clipId: string, persist = true) {
  const clip = findClip(state, clipId)
  if (!clip) return
  clip.mirror = !clip.mirror
  syncProjectClip(state, clipId, c => { c.mirror = clip.mirror })
  if (persist && state.currentProject.value) {
    state.currentProject.value.modified_at = new Date().toISOString()
    saveProjectToStorage(state)
  }
}
