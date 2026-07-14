import { ref, computed, reactive, markRaw } from 'vue'
import { useProjectStore } from '../../stores/project'
import { storeToRefs } from 'pinia'
import type { Project, VideoClip } from '../../stores/project'

export type ProjectStore = ReturnType<typeof useProjectStore>

export interface BaseEditorState {
  projectStore: ProjectStore
  currentProject: Project | null
  proxySettings: { enabled: boolean; resolution: string; codec: string; bitrate: string; useGPU: boolean }
  selectedClip: VideoClip | null
  selectedClips: VideoClip[]
  currentTime: number
  isPlaying: boolean
  activeTool: 'rotate' | 'scale' | 'move' | null
  timelineHeight: number
  videoPreview: { seekTo: (time: number) => void; togglePlay: () => void } | null
  showProxySettings: boolean
  showImportModal: boolean
  showExportModal: boolean
  showExitConfirmation: boolean
  timelineZoom: number
  timelineScroll: number
  conversionProgress: number
  conversionMessage: string
  isConverting: boolean
  cleanupConversionProgress: (() => void) | null
  previewClip: VideoClip | null
  setSelectedClips: (clips: VideoClip[]) => void
  syncSelectedClip: (id?: string) => void
  findClipAtOrAfter: (time: number) => VideoClip | null
  isElectron: () => boolean
}

export function useEditorState(): BaseEditorState {
  const projectStore = useProjectStore()
  const { currentProject, proxySettings } = storeToRefs(projectStore)

  const selectedClip = ref<VideoClip | null>(null)
  const selectedClips = ref<VideoClip[]>([])
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const activeTool = ref<'rotate' | 'scale' | 'move' | null>(null)
  const timelineHeight = ref(300)
  const videoPreview = ref<{ seekTo: (time: number) => void; togglePlay: () => void } | null>(null)
  const showProxySettings = ref(false)
  const showImportModal = ref(false)
  const showExportModal = ref(false)
  const showExitConfirmation = ref(false)
  const timelineZoom = ref(1)
  const timelineScroll = ref(0)
  const conversionProgress = ref(0)
  const conversionMessage = ref('')
  const isConverting = ref(false)
  const cleanupConversionProgress = ref<(() => void) | null>(null)

  function setSelectedClips(clips: VideoClip[]) {
    if (!Array.isArray(clips)) clips = []
    selectedClips.value = clips
    selectedClip.value = clips[clips.length - 1] || null
  }

  function syncSelectedClip(id?: string) {
    const project = currentProject.value
    if (!id || !project) {
      setSelectedClips([])
      return
    }
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === id)
      if (clip) {
        setSelectedClips([clip as VideoClip])
        return
      }
    }
    setSelectedClips([])
  }

  const previewClip = computed(() => {
    const project = currentProject.value
    if (!project) return null
    const clips = project.tracks.flatMap(t => t.clips).filter((c) => (c.metadata as any).width != null) as VideoClip[]
    const candidates = clips.filter(c => c.start_time <= currentTime.value && currentTime.value <= c.end_time)
    if (candidates.length === 0) return null
    return (candidates.find(c => c.start_time === currentTime.value) || candidates[0]) as VideoClip
  })

  function findClipAtOrAfter(time: number): VideoClip | null {
    const project = currentProject.value
    if (!project) return null
    const clips = project.tracks.flatMap(t => t.clips).filter((c) => (c.metadata as any).width != null) as VideoClip[]
    const sorted = [...clips].sort((a, b) => a.start_time - b.start_time)
    const next = sorted.find(c => c.start_time >= time)
    return next || sorted[0] || null
  }

  function isElectron() {
    return !!(typeof window !== 'undefined' && window.electronAPI)
  }

  const state = reactive({
    projectStore: markRaw(projectStore),
    currentProject: computed(() => currentProject.value),
    proxySettings,
    selectedClip,
    selectedClips,
    currentTime,
    isPlaying,
    activeTool,
    timelineHeight,
    videoPreview,
    showProxySettings,
    showImportModal,
    showExportModal,
    showExitConfirmation,
    timelineZoom,
    timelineScroll,
    conversionProgress,
    conversionMessage,
    isConverting,
    cleanupConversionProgress,
    previewClip,
    setSelectedClips,
    syncSelectedClip,
    findClipAtOrAfter,
    isElectron
  })

  return state as BaseEditorState
}
