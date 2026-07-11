import type { ProjectState, VideoMetadata, AudioMetadata } from './types'

export async function getVideoMetadata(state: ProjectState, path: string): Promise<VideoMetadata> {
  try {
    return await window.electronAPI.getVideoMetadata(path)
  } catch (e) {
    state.error.value = e as string
    throw e
  }
}

export async function getAudioMetadata(state: ProjectState, path: string): Promise<AudioMetadata> {
  try {
    return await window.electronAPI.getAudioMetadata(path)
  } catch (e) {
    state.error.value = e as string
    throw e
  }
}

export async function generateProxy(state: ProjectState, path: string, settings: { useGPU: boolean }): Promise<string> {
  try {
    state.isLoading.value = true
    state.error.value = null
    return await window.electronAPI.generateProxy(path, settings, settings.useGPU)
  } catch (e) {
    state.error.value = e as string
    throw e
  } finally {
    state.isLoading.value = false
  }
}

export async function convertVideo(state: ProjectState, path: string, settings: any): Promise<string> {
  try {
    state.isLoading.value = true
    state.error.value = null
    return await window.electronAPI.convertVideo(path, settings)
  } catch (e) {
    state.error.value = e as string
    throw e
  } finally {
    state.isLoading.value = false
  }
}

export async function exportVideo(state: ProjectState, outputPath: string, options?: { videoCodec?: string; audioCodec?: string; container?: string }): Promise<string> {
  if (!state.currentProject.value) throw new Error('No project loaded')
  try {
    state.isLoading.value = true
    state.error.value = null
    const plainProject = JSON.parse(JSON.stringify(state.currentProject.value))
    return await window.electronAPI.exportVideo(plainProject, outputPath, options)
  } catch (e) {
    state.error.value = e as string
    throw e
  } finally {
    state.isLoading.value = false
  }
}
