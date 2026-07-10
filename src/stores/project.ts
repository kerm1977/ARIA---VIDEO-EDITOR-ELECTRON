import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
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
}

export interface TimelineTrack {
  id: string
  name: string
  clips: VideoClip[]
}

export interface Project {
  id: string
  name: string
  created_at: string
  modified_at: string
  tracks: TimelineTrack[]
  duration: number
}

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project | null>(null)
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const proxySettings = ref<ProxySettings>({
    enabled: true,
    resolution: '1280:720',
    codec: 'libx264',
    bitrate: '2M',
    useGPU: false
  })

  const hasProject = computed(() => currentProject.value !== null)
  const projectDuration = computed(() => currentProject.value?.duration || 0)

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
        duration: 0
      } as Project
      currentProject.value = project
      projects.value.push(project)
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

  async function addClipToTrack(trackId: string, clip: VideoClip) {
    if (!currentProject.value) return
    
    try {
      isLoading.value = true
      error.value = null
      const updatedProject = { ...currentProject.value }
      const track = updatedProject.tracks.find(t => t.id === trackId)
      if (track) {
        track.clips.push(clip)
        updatedProject.duration = track.clips.reduce((sum, c) => sum + (c.end_time - c.start_time), 0)
        updatedProject.modified_at = new Date().toISOString()
      }
      currentProject.value = updatedProject
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
    generateProxy,
    addClipToTrack,
    exportVideo,
    setCurrentProject,
    clearError
  }
})
