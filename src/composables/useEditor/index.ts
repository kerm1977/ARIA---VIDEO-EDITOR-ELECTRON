import { useEditorState } from './state'
import { useEditorSelection } from './selection'
import { useEditorPlayback } from './playback'
import { useEditorUI } from './ui'
import { useEditorShortcuts } from './shortcuts'
import {
  useCutTool,
  useSplitTool,
  useDeleteTool,
  useMoveTool,
  useGapTool,
  useTransformTool,
  useUtilityTool,
  useEditorImport,
  useEditorExport
} from './tools'

export function useEditor() {
  const state = useEditorState()
  const { handleSelectClips, handleSelect } = useEditorSelection(state)
  const {
    handleTogglePlay,
    handleTimeUpdate,
    handlePlayStateChange,
    handleTimelineTimeUpdate
  } = useEditorPlayback(state)
  const {
    importVideo,
    processVideoImport,
    processAudioImport,
    handleGuitar,
    handleImport
  } = useEditorImport(state)

  const { exportProject, handleExport } = useEditorExport(state)
  const {
    goBack,
    confirmExit,
    cancelExit,
    saveProxySettings,
    startResize,
    handleUndo,
    handleRedo,
    handleProxy,
    handleSelectAll
  } = useEditorUI(state)
  const {
    handleCutClip
  } = useCutTool(state)
  const {
    handleSplitClip
  } = useSplitTool(state)
  const {
    handleCutAndDelete,
    handleDeleteSelected
  } = useDeleteTool(state)
  const {
    handleMoveClip
  } = useMoveTool(state)
  const {
    handleCloseGap,
    handleRemoveAllGaps
  } = useGapTool(state)
  const {
    handleRotate,
    handleRotateCommit,
    handleScale,
    handleScaleCommit,
    handlePosition,
    handlePositionCommit,
    handleFlip
  } = useTransformTool(state)
  const {
    handleText,
    handleSpeed,
    handleRecordAudio,
    handleProcess,
    handleAspectRatio
  } = useUtilityTool(state)

  useEditorShortcuts(state, {
    handleUndo,
    handleRedo,
    handleSelect,
    handleSelectAll,
    handleTogglePlay,
    handleCutClip,
    handleCloseGap,
    handleRemoveAllGaps,
    handleCutAndDelete,
    handleDeleteSelected,
    handleImportVideo: importVideo,
    handleFlip,
    handleRotate,
    handleRotateCommit,
    handleScale,
    handleScaleCommit,
    handlePosition,
    handlePositionCommit,
    handleText,
    handleSpeed,
    handleRecordAudio,
    handleGuitar,
    handleProcess,
    handleAspectRatio,
    handleProxy,
    handleMoveClip,
    handleSplitClip
  })

  return {
    state,
    handleSelectClips,
    handleSelect,
    handleTogglePlay,
    handleTimeUpdate,
    handlePlayStateChange,
    handleTimelineTimeUpdate,
    importVideo,
    processVideoImport,
    processAudioImport,
    handleGuitar,
    handleImport,
    exportProject,
    handleExport,
    goBack,
    confirmExit,
    cancelExit,
    saveProxySettings,
    startResize,
    handleUndo,
    handleRedo,
    handleProxy,
    handleSelectAll,
    handleCutClip,
    handleSplitClip,
    handleCutAndDelete,
    handleDeleteSelected,
    handleMoveClip,
    handleCloseGap,
    handleRotate,
    handleRotateCommit,
    handleScale,
    handleScaleCommit,
    handlePosition,
    handlePositionCommit,
    handleFlip,
    handleText,
    handleSpeed,
    handleRecordAudio,
    handleProcess,
    handleAspectRatio
  }
}
