import type { BaseEditorState } from './state'

export function useEditorMedia(state: BaseEditorState) {
  function needsVideoConversion(filePath: string, metadata: any): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    const container = metadata.container?.toLowerCase() || ''
    const audioCodec = metadata.audioCodec?.toLowerCase() || ''

    if (ext === 'mkv' || container === 'matroska') return true
    if (audioCodec === 'ac3' || audioCodec === 'eac3') return true
    if (['avi', 'wmv', 'mov'].includes(ext) && !metadata.codec?.includes('h264')) return true

    return false
  }

  async function convertVideoIfNeeded(filePath: string, metadata: any): Promise<string> {
    if (!needsVideoConversion(filePath, metadata) || !state.isElectron()) return filePath

    state.isConverting = true
    state.conversionProgress = 0
    state.conversionMessage = 'Starting conversion...'

    const settings = {
      videoCodec: 'h264',
      audioCodec: 'aac',
      videoBitrate: '2M',
      audioBitrate: '128k'
    }

    const convertedPath = await state.projectStore.convertVideo(filePath, settings)

    state.isConverting = false
    state.conversionProgress = 100
    state.conversionMessage = 'Conversion complete'

    return convertedPath
  }

  async function ensureVideoTrackExists(): Promise<string> {
    const project = state.projectStore.currentProject
    if (!project) throw new Error('No current project')

    let videoTrack = project.tracks.find(t => t.type === 'video')
    if (!videoTrack) {
      videoTrack = { id: crypto.randomUUID(), name: 'Video 1', type: 'video', clips: [] }
      const updatedProject = { ...project, tracks: [...project.tracks, videoTrack] }
      state.projectStore.setCurrentProject(updatedProject)
    }
    return videoTrack.id
  }

  return { needsVideoConversion, convertVideoIfNeeded, ensureVideoTrackExists }
}
