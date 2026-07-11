import type { BaseEditorState } from '../state'

export function useUtilityTool(state: BaseEditorState) {
  function handleText() {
    alert('Text tool coming soon')
  }

  function handleSpeed() {
    alert('Speed control coming soon')
  }

  function handleRecordAudio() {
    alert('Audio recording coming soon')
  }

  function handleProcess() {
    alert('Process tool coming soon')
  }

  function handleAspectRatio(ratio: string) {
    state.projectStore.setProjectAspectRatio(ratio)
  }

  return {
    handleText,
    handleSpeed,
    handleRecordAudio,
    handleProcess,
    handleAspectRatio
  }
}
