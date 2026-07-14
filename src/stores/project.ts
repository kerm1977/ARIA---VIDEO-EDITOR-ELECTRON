import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ProjectState, Project, ProxySettings } from './project/types'
export type { Project, ProxySettings, VideoMetadata, AudioMetadata, VideoClip, AudioClip, TimelineTrack } from './project/types'
import { saveProjectToStorage, updateProjectDuration, setProjectAspectRatio } from './project/core'
import { undo, redo, pushHistory } from './project/history'
import { getVideoMetadata, getAudioMetadata, generateProxy, convertVideo, exportVideo } from './project/media'
import {
  addClipToTrack, deleteClip, splitClip, moveClip, cutAndDelete, closeGap, removeAllGaps
} from './project/clip'
import { setClipRotation, setClipScale, setClipPosition, setClipMirror } from './project/transform'

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null)
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const proxySettings = ref<ProxySettings>({
    enabled: false,
    resolution: '1280:720',
    codec: 'libx264',
    bitrate: '2M',
    useGPU: false
  })

  const history = ref<{ currentProject: Project | null; projects: Project[]; proxySettings: ProxySettings }[]>([])
  const historyIndex = ref(-1)

  const hasProject = computed(() => currentProject.value !== null)
  const projectDuration = computed(() => currentProject.value?.duration || 0)

  const state: ProjectState = {
    currentProject, projects, isLoading, error, proxySettings, history, historyIndex, hasProject, projectDuration
  }

  let autoSaveInterval: number | null = null

  function _pushHistory() { pushHistory(state) }

  async function createProject(name: string) {
    try {
      isLoading.value = true
      error.value = null
      const project = {
        id: crypto.randomUUID(),
        name,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        tracks: [],
        duration: 0,
        aspectRatio: 'libre'
      } as Project
      currentProject.value = project
      projects.value.push(project)
      _pushHistory()
      return project
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function loadProjectFromStorage() {
    try {
      let data: string | null = null
      if (typeof window !== 'undefined' && window.electronAPI) {
        data = await window.electronAPI.loadProjectData()
      } else {
        data = localStorage.getItem('aria-video-editor-data')
      }

      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.projects) {
          projects.value = parsed.projects.map((p: Project) => ({ ...p, aspectRatio: p.aspectRatio || 'libre' }))
          for (const project of projects.value) {
            for (const track of project.tracks) {
              for (const clip of track.clips) {
                const c = clip as any
                c.rotation = c.rotation || 0
                c.scale = c.scale || 1
                c.positionX = c.positionX || 0
                c.positionY = c.positionY || 0
                c.mirror = c.mirror || false
              }
            }
          }
        }
        if (parsed.proxySettings) proxySettings.value = parsed.proxySettings
        _pushHistory()
        return true
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
    return false
  }

  function setCurrentProject(project: Project | null) { currentProject.value = project }

  function deleteProject(projectId: string) {
    projects.value = projects.value.filter(p => p.id !== projectId)
    if (currentProject.value?.id === projectId) currentProject.value = null
    saveProjectToStorage(state)
    _pushHistory()
  }

  function startAutoSave(intervalMs: number = 30000) {
    if (autoSaveInterval) clearInterval(autoSaveInterval)
    autoSaveInterval = window.setInterval(() => saveProjectToStorage(state), intervalMs)
  }

  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }
  }

  function clearError() { error.value = null }

  watch([currentProject, projects, proxySettings], () => saveProjectToStorage(state), { deep: true })

  return {
    currentProject,
    projects,
    isLoading,
    error,
    proxySettings,
    hasProject,
    projectDuration,
    createProject,
    setCurrentProject,
    deleteProject,
    clearError,
    saveProjectToStorage: () => saveProjectToStorage(state),
    loadProjectFromStorage,
    startAutoSave,
    stopAutoSave,
    undo: () => undo(state),
    redo: () => redo(state),
    pushHistory: _pushHistory,
    getVideoMetadata: (path: string) => getVideoMetadata(state, path),
    getAudioMetadata: (path: string) => getAudioMetadata(state, path),
    generateProxy: (path: string, settings: any) => generateProxy(state, path, settings),
    convertVideo: (path: string, settings: any) => convertVideo(state, path, settings),
    addClipToTrack: (trackId: string, clip: any) => addClipToTrack(state, _pushHistory, trackId, clip),
    exportVideo: (outputPath: string, options?: { videoCodec?: string; audioCodec?: string; container?: string }) => exportVideo(state, outputPath, options),
    deleteClip: (clipId: string) => deleteClip(state, _pushHistory, clipId),
    splitClip: (clipId: string, splitTime: number) => splitClip(state, _pushHistory, clipId, splitTime),
    moveClip: (clipId: string, newStart: number) => moveClip(state, _pushHistory, clipId, newStart),
    cutAndDelete: (clipId: string, cutTime: number) => cutAndDelete(state, _pushHistory, clipId, cutTime),
    closeGap: (time: number) => closeGap(state, _pushHistory, time),
    removeAllGaps: () => removeAllGaps(state, _pushHistory),
    updateProjectDuration: () => updateProjectDuration(state),
    setProjectAspectRatio: (ratio: string) => setProjectAspectRatio(state, _pushHistory, ratio),
    setClipRotation: (clipId: string, angle: number, persist?: boolean) => setClipRotation(state, clipId, angle, persist),
    setClipScale: (clipId: string, scale: number, persist?: boolean) => setClipScale(state, clipId, scale, persist),
    setClipPosition: (clipId: string, x: number, y: number, persist?: boolean) => setClipPosition(state, clipId, x, y, persist),
    setClipMirror: (clipId: string, persist?: boolean) => setClipMirror(state, clipId, persist)
  }
})
