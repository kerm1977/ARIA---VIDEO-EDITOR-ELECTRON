import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  container: string
  bitrate: number
  file_size: number
  hasAudio: boolean
  audioCodec: string
}

export interface AudioMetadata {
  duration: number
  codec: string
  channels: number
  sample_rate: number
  bitrate: number
  file_size: number
}

export interface ProxySettings {
  enabled: boolean
  resolution: string
  codec: string
  bitrate: string
  useGPU: boolean
}

export interface VideoClip {
  id: string
  original_path: string
  proxy_path?: string
  metadata: VideoMetadata
  start_time: number
  end_time: number
  in_point: number
  out_point: number
  type?: 'video' | 'audio'
  rotation?: number
  mirror?: boolean
  scale?: number
  positionX?: number
  positionY?: number
}

export interface AudioClip {
  id: string
  original_path: string
  metadata: AudioMetadata
  start_time: number
  end_time: number
  in_point: number
  out_point: number
}

export interface TimelineTrack {
  id: string
  name: string
  type: 'video' | 'audio'
  clips: (VideoClip | AudioClip)[]
}

export interface Project {
  id: string
  name: string
  created_at: string
  modified_at: string
  tracks: TimelineTrack[]
  duration: number
  aspectRatio?: string
}

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

  const hasProject = computed(() => currentProject.value !== null)
  const projectDuration = computed(() => currentProject.value?.duration || 0)

  // Auto-save interval
  let autoSaveInterval: number | null = null

  // Undo/Redo history
  const MAX_HISTORY = 50
  const history = ref<{ currentProject: Project | null; projects: Project[]; proxySettings: ProxySettings }[]>([])
  const historyIndex = ref(-1)

  function pushHistory() {
    const snapshot = {
      currentProject: currentProject.value,
      projects: projects.value,
      proxySettings: proxySettings.value
    }
    const cloned = JSON.parse(JSON.stringify(snapshot))
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1)
    }
    history.value.push(cloned)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function restoreHistory() {
    const snapshot = history.value[historyIndex.value]
    if (snapshot) {
      currentProject.value = JSON.parse(JSON.stringify(snapshot.currentProject))
      projects.value = JSON.parse(JSON.stringify(snapshot.projects))
      proxySettings.value = JSON.parse(JSON.stringify(snapshot.proxySettings))
    }
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreHistory()
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreHistory()
    }
  }

  // Save project to storage
  async function saveProjectToStorage() {
    try {
      const data = JSON.stringify({
        currentProject: currentProject.value,
        projects: projects.value,
        proxySettings: proxySettings.value
      })

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Electron: save to file
        await window.electronAPI.saveProjectData(data)
      } else {
        // Web: save to localStorage
        localStorage.setItem('aria-video-editor-data', data)
      }
    } catch (e) {
      console.error('Failed to save project:', e)
    }
  }

  // Load project from storage
  async function loadProjectFromStorage() {
    try {
      let data: string | null = null

      if (typeof window !== 'undefined' && window.electronAPI) {
        // Electron: load from file
        data = await window.electronAPI.loadProjectData()
      } else {
        // Web: load from localStorage
        data = localStorage.getItem('aria-video-editor-data')
      }

      if (data) {
        const parsed = JSON.parse(data)
        // Never auto-restore currentProject: app must always open on the projects grid
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
        pushHistory()
        return true
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
    return false
  }

  // Start auto-save
  function startAutoSave(intervalMs: number = 30000) {
    if (autoSaveInterval) clearInterval(autoSaveInterval)
    autoSaveInterval = window.setInterval(() => {
      saveProjectToStorage()
    }, intervalMs)
  }

  // Stop auto-save
  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }
  }

  // Watch for changes and auto-save
  watch([currentProject, projects, proxySettings], () => {
    saveProjectToStorage()
  }, { deep: true })

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
      pushHistory()
      return project
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function getVideoMetadata(path: string): Promise<VideoMetadata> {
    try {
      return await window.electronAPI.getVideoMetadata(path)
    } catch (e) {
      error.value = e as string
      throw e
    }
  }

  async function getAudioMetadata(path: string): Promise<AudioMetadata> {
    try {
      return await window.electronAPI.getAudioMetadata(path)
    } catch (e) {
      error.value = e as string
      throw e
    }
  }

  async function generateProxy(path: string, settings: ProxySettings): Promise<string> {
    try {
      isLoading.value = true
      error.value = null
      return await window.electronAPI.generateProxy(path, settings, settings.useGPU)
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function convertVideo(path: string, settings: any): Promise<string> {
    try {
      isLoading.value = true
      error.value = null
      return await window.electronAPI.convertVideo(path, settings)
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function addClipToTrack(trackId: string, clip: VideoClip | any) {
    if (!currentProject.value) return

    try {
      isLoading.value = true
      error.value = null
      const updatedProject = { ...currentProject.value }
      const track = updatedProject.tracks.find(t => t.id === trackId)
      if (track) {
        track.clips.push(clip)
        // Calculate project duration as the maximum end time across all clips
        let maxEnd = 0
        updatedProject.tracks.forEach(t => {
          t.clips.forEach(c => {
            if (c.end_time > maxEnd) maxEnd = c.end_time
          })
        })
        updatedProject.duration = maxEnd
        updatedProject.modified_at = new Date().toISOString()
      }
      currentProject.value = updatedProject
      // Update project in projects list
      const projectIndex = projects.value.findIndex(p => p.id === updatedProject.id)
      if (projectIndex !== -1) {
        projects.value[projectIndex] = updatedProject
      }
      // Save to storage
      await saveProjectToStorage()
      pushHistory()
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function exportVideo(outputPath: string): Promise<string> {
    if (!currentProject.value) throw new Error('No project loaded')
    
    try {
      isLoading.value = true
      error.value = null
      return await window.electronAPI.exportVideo(currentProject.value, outputPath)
    } catch (e) {
      error.value = e as string
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  function deleteProject(projectId: string) {
    projects.value = projects.value.filter(p => p.id !== projectId)
    if (currentProject.value?.id === projectId) {
      currentProject.value = null
    }
    saveProjectToStorage()
    pushHistory()
  }

  async function deleteClip(clipId: string) {
    if (!currentProject.value) return
    for (const track of currentProject.value.tracks) {
      const idx = track.clips.findIndex(c => c.id === clipId)
      if (idx !== -1) {
        track.clips.splice(idx, 1)
        break
      }
    }
    let maxEnd = 0
    currentProject.value.tracks.forEach(t => {
      t.clips.forEach(c => {
        if (c.end_time > maxEnd) maxEnd = c.end_time
      })
    })
    currentProject.value.duration = maxEnd
    currentProject.value.modified_at = new Date().toISOString()
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) projects.value[projectIndex] = currentProject.value
    await saveProjectToStorage()
    pushHistory()
  }

  function setProjectAspectRatio(ratio: string) {
    if (!currentProject.value) return
    currentProject.value.aspectRatio = ratio
    currentProject.value.modified_at = new Date().toISOString()
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) projects.value[projectIndex] = currentProject.value
    saveProjectToStorage()
    pushHistory()
  }

  function setClipRotation(clipId: string, angle: number, persist = true) {
    if (!currentProject.value) return
    const clip = currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
    if (!clip) return
    clip.rotation = angle
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) {
      const pClip = projects.value[projectIndex].tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
      if (pClip) pClip.rotation = angle
    }
    if (persist) {
      currentProject.value.modified_at = new Date().toISOString()
      saveProjectToStorage()
    }
  }

  function setClipScale(clipId: string, scale: number, persist = true) {
    if (!currentProject.value) return
    const clip = currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
    if (!clip) return
    clip.scale = scale
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) {
      const pClip = projects.value[projectIndex].tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
      if (pClip) pClip.scale = scale
    }
    if (persist) {
      currentProject.value.modified_at = new Date().toISOString()
      saveProjectToStorage()
    }
  }

  function setClipPosition(clipId: string, x: number, y: number, persist = true) {
    if (!currentProject.value) return
    const clip = currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
    if (!clip) return
    clip.positionX = x
    clip.positionY = y
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) {
      const pClip = projects.value[projectIndex].tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
      if (pClip) {
        pClip.positionX = x
        pClip.positionY = y
      }
    }
    if (persist) {
      currentProject.value.modified_at = new Date().toISOString()
      saveProjectToStorage()
    }
  }

  function setClipMirror(clipId: string, persist = true) {
    if (!currentProject.value) return
    const clip = currentProject.value.tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
    if (!clip) return
    clip.mirror = !clip.mirror
    const projectIndex = projects.value.findIndex(p => p.id === currentProject.value!.id)
    if (projectIndex !== -1) {
      const pClip = projects.value[projectIndex].tracks.flatMap(t => t.clips).find(c => c.id === clipId) as any
      if (pClip) pClip.mirror = clip.mirror
    }
    if (persist) {
      currentProject.value.modified_at = new Date().toISOString()
      saveProjectToStorage()
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    currentProject,
    projects,
    isLoading,
    error,
    proxySettings,
    hasProject,
    projectDuration,
    createProject,
    getVideoMetadata,
    getAudioMetadata,
    generateProxy,
    convertVideo,
    addClipToTrack,
    exportVideo,
    setCurrentProject,
    deleteProject,
    clearError,
    saveProjectToStorage,
    loadProjectFromStorage,
    startAutoSave,
    stopAutoSave,
    undo,
    redo,
    pushHistory,
    deleteClip,
    setProjectAspectRatio,
    setClipRotation,
    setClipScale,
    setClipPosition,
    setClipMirror
  }
})
