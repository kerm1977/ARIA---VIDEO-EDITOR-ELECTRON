import { ref } from 'vue'
import type { TimelineTrack, VideoClip } from '../stores/project'

interface TimelineProps {
  tracks: TimelineTrack[]
  selectedClips?: VideoClip[]
}

interface TimelineEmit {
  (e: 'timeUpdate', time: number): void
  (e: 'move-clip', clipId: string, newStart: number): void
  (e: 'select-clips', clips: VideoClip[]): void
}

export function useTimelineDrag(props: TimelineProps, emit: TimelineEmit, state: { playheadPosition: { value: number }; isDragging: { value: boolean }; effectiveDuration: { value: number }; baseDuration: { value: number } }) {
  const dragClip = ref<{ clip: any | null; trackId: string; startX: number; startTime: number; length: number; laneWidth: number; moved: boolean; originalStartTime: number; dragDirection: 'left' | 'right' | null } | null>(null)

  function onDrag(e: MouseEvent) {
    if (!state.isDragging.value) return
    const timeline = document.querySelector('.timeline')
    if (!timeline) return
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * state.effectiveDuration.value
    state.playheadPosition.value = (newTime / state.effectiveDuration.value) * 100
    emit('timeUpdate', Math.max(0, Math.min(newTime, state.baseDuration.value)))
  }

  function stopDrag() {
    state.isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  function startDrag() {
    state.isDragging.value = true
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function startRulerDrag(e: MouseEvent) {
    if (e.button !== 0) return
    state.isDragging.value = true
    onDrag(e)
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  function onClipDrag(e: MouseEvent) {
    if (!dragClip.value || !dragClip.value.clip) return
    const s = dragClip.value
    const deltaX = e.clientX - s.startX
    const deltaTime = (deltaX / s.laneWidth) * state.effectiveDuration.value
    const newStart = Math.max(0, s.startTime + deltaTime)
    s.clip.start_time = newStart
    s.clip.end_time = newStart + s.length
    s.moved = true
    
    if (deltaX > 0) {
      s.dragDirection = 'right'
    } else if (deltaX < 0) {
      s.dragDirection = 'left'
    }
  }

  function checkOverlap(clip: any, trackId: string, newStart: number, newEnd: number): boolean {
    const track = props.tracks.find(t => t.id === trackId)
    if (!track) return false
    for (const otherClip of track.clips) {
      if (otherClip.id === clip.id) continue
      if (newStart < otherClip.end_time && newEnd > otherClip.start_time) {
        return true
      }
    }
    return false
  }

  function findSnapPosition(clip: any, trackId: string, newStart: number, clipLength: number, dragDirection: 'left' | 'right' | null): number {
    const track = props.tracks.find(t => t.id === trackId)
    if (!track) return newStart

    const otherClips = track.clips.filter(c => c.id !== clip.id).sort((a, b) => a.start_time - b.start_time)
    const newEnd = newStart + clipLength

    for (const otherClip of otherClips) {
      if (newStart < otherClip.end_time && newEnd > otherClip.start_time) {
        if (dragDirection === 'right') {
          return otherClip.end_time
        } else if (dragDirection === 'left') {
          return otherClip.start_time - clipLength
        }
      }
    }
    return newStart
  }

  function stopClipDrag() {
    if (dragClip.value && dragClip.value.clip) {
      if (dragClip.value.moved) {
        const hasOverlap = checkOverlap(dragClip.value.clip, dragClip.value.trackId, dragClip.value.clip.start_time, dragClip.value.clip.end_time)
        if (hasOverlap) {
          const snapPosition = findSnapPosition(dragClip.value.clip, dragClip.value.trackId, dragClip.value.clip.start_time, dragClip.value.length, dragClip.value.dragDirection)
          dragClip.value.clip.start_time = snapPosition
          dragClip.value.clip.end_time = snapPosition + dragClip.value.length
          emit('move-clip', dragClip.value.clip.id, snapPosition)
        } else {
          emit('move-clip', dragClip.value.clip.id, dragClip.value.clip.start_time)
        }
      }
      dragClip.value = null
    }
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', onClipDrag)
    document.removeEventListener('mouseup', stopClipDrag)
  }

  function startClipDrag(e: MouseEvent, clip: any, trackId: string) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement)?.classList.contains('handle')) return
    e.stopPropagation()
    if (e.shiftKey || e.ctrlKey) {
      const existing = new Set((props.selectedClips || []).map(c => c.id))
      if (existing.has(clip.id)) existing.delete(clip.id)
      else existing.add(clip.id)
      const final = props.tracks.flatMap(t => t.clips).filter(c => existing.has(c.id)) as VideoClip[]
      emit('select-clips', final)
    } else {
      emit('select-clips', [clip as VideoClip])
    }
    const lane = (e.currentTarget as HTMLElement).parentElement
    const rect = lane?.getBoundingClientRect()
    if (!rect) return
    dragClip.value = { clip, trackId, startX: e.clientX, startTime: clip.start_time, length: clip.end_time - clip.start_time, laneWidth: rect.width, moved: false, originalStartTime: clip.start_time, dragDirection: null }
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onClipDrag)
    document.addEventListener('mouseup', stopClipDrag)
  }

  return {
    startDrag,
    startRulerDrag,
    onDrag,
    stopDrag,
    startClipDrag,
    onClipDrag,
    stopClipDrag
  }
}
