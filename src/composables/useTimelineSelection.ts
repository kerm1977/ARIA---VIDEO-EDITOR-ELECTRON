import { ref, computed } from 'vue'
import type { TimelineTrack, VideoClip } from '../stores/project'

interface TimelineProps {
  tracks: TimelineTrack[]
  selectedClips?: VideoClip[]
}

interface TimelineEmit {
  (e: 'select-clips', clips: VideoClip[]): void
}

export function useTimelineSelection(props: TimelineProps, emit: TimelineEmit, effectiveDuration: { value: number }) {
  const boxSelection = ref({ visible: false, trackId: '', startX: 0, startY: 0, currentX: 0, currentY: 0, laneWidth: 0, laneLeft: 0, shiftKey: false })

  const selectedClipIds = computed(() => {
    const ids = new Set<string>()
    if (boxSelection.value.visible && boxSelection.value.trackId && boxSelection.value.laneWidth > 0) {
      const track = props.tracks.find(t => t.id === boxSelection.value.trackId)
      if (track) {
        const minX = Math.min(boxSelection.value.startX, boxSelection.value.currentX)
        const maxX = Math.max(boxSelection.value.startX, boxSelection.value.currentX)
        const minTime = (minX / boxSelection.value.laneWidth) * effectiveDuration.value
        const maxTime = (maxX / boxSelection.value.laneWidth) * effectiveDuration.value
        for (const clip of track.clips) {
          if (clip.start_time < maxTime && clip.end_time > minTime) ids.add(clip.id)
        }
      }
    } else {
      for (const clip of props.selectedClips || []) ids.add(clip.id)
    }
    return ids
  })

  const selectionBoxStyle = computed(() => {
    const minX = Math.min(boxSelection.value.startX, boxSelection.value.currentX)
    const maxX = Math.max(boxSelection.value.startX, boxSelection.value.currentX)
    return { left: minX + 'px', width: (maxX - minX) + 'px' }
  })

  function startBoxSelection(e: MouseEvent, trackId: string) {
    if (e.button !== 0) return
    if (e.target !== e.currentTarget) return
    const lane = e.currentTarget as HTMLElement
    const rect = lane.getBoundingClientRect()
    const x = e.clientX - rect.left
    boxSelection.value = { visible: true, trackId, startX: x, startY: 0, currentX: x, currentY: 0, laneWidth: rect.width, laneLeft: rect.left, shiftKey: e.shiftKey }
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onBoxMove)
    document.addEventListener('mouseup', stopBoxSelection)
  }

  function onBoxMove(e: MouseEvent) {
    if (!boxSelection.value.visible) return
    boxSelection.value.currentX = e.clientX - boxSelection.value.laneLeft
  }

  function stopBoxSelection() {
    if (!boxSelection.value.visible) return
    const track = props.tracks.find(t => t.id === boxSelection.value.trackId)
    const selectedIds = new Set<string>()
    if (track && boxSelection.value.laneWidth > 0) {
      const minX = Math.min(boxSelection.value.startX, boxSelection.value.currentX)
      const maxX = Math.max(boxSelection.value.startX, boxSelection.value.currentX)
      const minTime = (minX / boxSelection.value.laneWidth) * effectiveDuration.value
      const maxTime = (maxX / boxSelection.value.laneWidth) * effectiveDuration.value
      for (const clip of track.clips) {
        if (clip.start_time < maxTime && clip.end_time > minTime) selectedIds.add(clip.id)
      }
    }
    let finalClips: VideoClip[] = []
    if (boxSelection.value.shiftKey) {
      const existing = new Set((props.selectedClips || []).map(c => c.id))
      for (const id of selectedIds) existing.add(id)
      finalClips = props.tracks.flatMap(t => t.clips).filter(c => existing.has(c.id)) as VideoClip[]
    } else {
      finalClips = track ? track.clips.filter(c => selectedIds.has(c.id)) as VideoClip[] : []
    }
    emit('select-clips', finalClips)
    boxSelection.value.visible = false
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', onBoxMove)
    document.removeEventListener('mouseup', stopBoxSelection)
  }

  return {
    boxSelection,
    selectedClipIds,
    selectionBoxStyle,
    startBoxSelection,
    onBoxMove,
    stopBoxSelection
  }
}
