import type { BaseEditorState } from '../state'
import type { VideoClip } from '../../../stores/project'
import { useEditorMedia } from '../media'

export function useEditorImport(state: BaseEditorState) {
  const { convertVideoIfNeeded, ensureVideoTrackExists } = useEditorMedia(state)

  async function processVideoImport(filePath: string) {
    try {
      const metadata = await state.projectStore.getVideoMetadata(filePath)
      const finalPath = await convertVideoIfNeeded(filePath, metadata)

      if (finalPath !== filePath) {
        const newMetadata = await state.projectStore.getVideoMetadata(finalPath)
        Object.assign(metadata, newMetadata)
      }

      const clip: VideoClip = {
        id: crypto.randomUUID(),
        original_path: finalPath,
        proxy_path: undefined,
        metadata,
        start_time: 0,
        end_time: metadata.duration,
        in_point: 0,
        out_point: metadata.duration
      }

      const trackId = await ensureVideoTrackExists()
      await state.projectStore.addClipToTrack(trackId, clip)
      state.setSelectedClips([clip])
    } catch (error) {
      console.error('Failed to import video:', error)
      state.isConverting = false
      alert('Failed to import video: ' + error)
    }
  }

  async function importVideo() {
    if (!state.isElectron()) {
      state.showImportModal = true
      return
    }
    try {
      const filePath = await window.electronAPI.dialogOpen({
        properties: ['openFile'],
        filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
      })
      if (filePath) await processVideoImport(filePath)
    } catch (error) {
      console.warn('Electron dialog failed, falling back to web input:', error)
      state.showImportModal = true
    }
  }

  async function processAudioImport(filePath: string, webUrl?: string, fileSize?: number) {
    try {
      let metadata
      if (state.isElectron() && !webUrl) {
        metadata = await state.projectStore.getAudioMetadata(filePath)
      } else {
        metadata = {
          duration: 60,
          codec: 'aac',
          channels: 2,
          sample_rate: 44100,
          bitrate: 128000,
          file_size: fileSize || 0
        }
      }

      const audioClip = {
        id: crypto.randomUUID(),
        original_path: filePath,
        metadata,
        start_time: 0,
        end_time: metadata.duration,
        in_point: 0,
        out_point: metadata.duration
      }

      const project = state.projectStore.currentProject
      if (!project) {
        alert('Please create a project first')
        return
      }

      let audioTrack = project.tracks.find(t => t.type === 'audio')
      if (!audioTrack) {
        audioTrack = { id: crypto.randomUUID(), name: 'Audio 1', type: 'audio', clips: [] }
        project.tracks.push(audioTrack)
      }

      await state.projectStore.addClipToTrack(audioTrack.id, audioClip)
      alert('Audio imported successfully!')
    } catch (error) {
      console.error('Failed to process audio:', error)
      alert('Failed to process audio: ' + error)
    }
  }

  async function handleGuitar() {
    const project = state.projectStore.currentProject
    if (!project) {
      alert('Please create a project first')
      return
    }

    if (!state.isElectron()) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) await processAudioImport(file.name, URL.createObjectURL(file), file.size)
      }
      input.click()
      return
    }

    try {
      const filePath = await window.electronAPI.dialogOpen({
        properties: ['openFile'],
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma'] }]
      })
      if (filePath) await processAudioImport(filePath)
    } catch (error) {
      console.error('Failed to import audio:', error)
      alert('Failed to import audio: ' + error)
    }
  }

  async function handleImport(file: File) {
    const url = URL.createObjectURL(file)
    const mockClip: VideoClip = {
      id: crypto.randomUUID(),
      original_path: file.name,
      proxy_path: url,
      metadata: { duration: 0, width: 1920, height: 1080, fps: 30, codec: 'h264', container: 'mp4', bitrate: 5000000, file_size: file.size, hasAudio: true, audioCodec: 'aac' },
      start_time: 0, end_time: 60, in_point: 0, out_point: 60
    }
    const project = state.projectStore.currentProject
    if (project) {
      if (project.tracks.length === 0) project.tracks.push({ id: crypto.randomUUID(), name: 'Video 1', type: 'video', clips: [] })
      await state.projectStore.addClipToTrack(project.tracks[0].id, mockClip)
      state.setSelectedClips([mockClip])
    }
    state.showImportModal = false
  }

  return { importVideo, processVideoImport, processAudioImport, handleGuitar, handleImport }
}
