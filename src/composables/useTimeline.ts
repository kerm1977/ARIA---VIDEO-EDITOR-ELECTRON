import { ref, computed, watch, onUnmounted } from 'vue'
import { useTimelineDrag } from './useTimelineDrag'
import { useTimelineSelection } from './useTimelineSelection'
import type { TimelineTrack, VideoClip } from '../stores/project'

export function useTimeline(props: { tracks: TimelineTrack[]; duration: number; currentTime: number; isPlaying: boolean; selectedClips?: VideoClip[]; timelineZoom?: number }, emit: {
  (e: 'addClip', trackId: string): void
  (e: 'select-clips', clips: VideoClip[]): void
  (e: 'timeUpdate', time: number): void
  (e: 'cutClip'): void
  (e: 'move-clip', clipId: string, newStart: number): void
  (e: 'split-clip', clipId: string, splitTime: number): void
}) {
  const playheadPosition = ref(0)
  const isDragging = ref(false)
  const contextMenu = ref({ visible: false, x: 0, y: 0, clip: null as VideoClip | null, cutTime: 0 })
  const clipInfoModal = ref({ visible: false, data: null as VideoClip | null })

  const baseDuration = computed(() => {
    let maxEnd = 0
    for (const track of props.tracks) {
      for (const clip of track.clips) {
        if (clip.end_time > maxEnd) maxEnd = clip.end_time
      }
    }
    return Math.max(props.duration || 0, maxEnd, 60)
  })

  const effectiveDuration = computed(() => {
    const zoom = props.timelineZoom || 1
    return baseDuration.value / zoom
  })

  const timeMarks = computed(() => {
    const marks = []
    const totalDuration = effectiveDuration.value
    let interval = totalDuration < 60 ? 5 : 10
    if (totalDuration > 1800) interval = 300
    else if (totalDuration > 1200) interval = 240
    else if (totalDuration > 600) interval = 120
    for (let i = 0; i <= totalDuration; i += interval) marks.push({ time: i, position: (i / totalDuration) * 100, major: true })
    const minorInterval = 60
    for (let i = 0; i <= totalDuration; i += minorInterval) {
      if (i % interval !== 0) marks.push({ time: i, position: (i / totalDuration) * 100, major: false })
    }
    return marks
  })

  const drag = useTimelineDrag(props, emit, { playheadPosition, isDragging, effectiveDuration, baseDuration })
  const selection = useTimelineSelection(props, emit, effectiveDuration)

  function showContextMenu(event: MouseEvent, clip: any) {
    const target = event.currentTarget as HTMLElement
    const lane = target?.parentElement
    let cutTime = 0
    if (lane) {
      const rect = lane.getBoundingClientRect()
      const totalDuration = effectiveDuration.value
      cutTime = Math.max(0, Math.min(((event.clientX - rect.left) / rect.width) * totalDuration, totalDuration))
    }
    contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, clip, cutTime }
  }

  function hideContextMenu() { contextMenu.value.visible = false }
  function showClipInfo() { clipInfoModal.value = { visible: true, data: contextMenu.value.clip }; hideContextMenu() }
  function hideClipInfo() { clipInfoModal.value.visible = false }

  function goToFileLocation() {
    if (contextMenu.value.clip?.original_path && typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.showItemInFolder(contextMenu.value.clip.original_path)
    }
    hideContextMenu()
  }

  function createProxy() {
    if (contextMenu.value.clip) emit('select-clips', [contextMenu.value.clip as VideoClip])
    hideContextMenu()
  }

  function splitClipAtCursor() {
    if (contextMenu.value.clip) emit('split-clip', contextMenu.value.clip.id, contextMenu.value.cutTime)
    hideContextMenu()
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', drag.onDrag)
    document.removeEventListener('mouseup', drag.stopDrag)
    document.removeEventListener('mousemove', drag.onClipDrag)
    document.removeEventListener('mouseup', drag.stopClipDrag)
    document.removeEventListener('mousemove', selection.onBoxMove)
    document.removeEventListener('mouseup', selection.stopBoxSelection)
  })

  watch(() => props.currentTime, (time) => {
    if (!isDragging.value) {
      playheadPosition.value = (time / effectiveDuration.value) * 100
    }
  })

  return {
    playheadPosition,
    contextMenu,
    clipInfoModal,
    effectiveDuration,
    baseDuration,
    timeMarks,
    ...drag,
    ...selection,
    showContextMenu,
    hideContextMenu,
    showClipInfo,
    hideClipInfo,
    goToFileLocation,
    createProxy,
    splitClipAtCursor
  }
}
