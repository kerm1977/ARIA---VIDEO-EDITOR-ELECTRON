import type { BaseEditorState } from '../state'

export interface ExportOptions {
  videoCodec: 'libx264' | 'libx265'
  audioCodec: 'aac' | 'libmp3lame'
  container: 'mp4'
}

export function useEditorExport(state: BaseEditorState) {
  function exportProject() {
    if (!state.isElectron()) {
      alert('Export is only available in Electron mode')
      return
    }
    state.showExportModal = true
  }

  async function handleExport(options: ExportOptions) {
    state.showExportModal = false
    if (!state.isElectron() || !state.currentProject) return
    try {
      const outputPath = await window.electronAPI.dialogSave({
        defaultPath: `${state.currentProject.name || 'export'}.mp4`,
        filters: [{ name: 'MP4', extensions: ['mp4'] }]
      })
      if (!outputPath) return
      state.isConverting = true
      state.conversionMessage = 'Exporting video...'
      await state.projectStore.exportVideo(outputPath, {
        videoCodec: options.videoCodec,
        audioCodec: options.audioCodec,
        container: options.container
      })
      alert('Export completed successfully!')
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Export failed: ' + error)
    } finally {
      state.isConverting = false
    }
  }

  return { exportProject, handleExport }
}
