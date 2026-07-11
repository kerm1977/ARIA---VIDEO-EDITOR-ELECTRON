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
  const dragClip = ref<{ clip: any | null; trackId: string; startX: number; startTime: number; length: number; laneWidth: number; moved: boolean } | null>(null)

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
  }

  function stopClipDrag() {
    if (dragClip.value && dragClip.value.clip) {
      if (dragClip.value.moved) {
        emit('move-clip', dragClip.value.clip.id, dragClip.value.clip.start_time)
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
    dragClip.value = { clip, trackId, startX: e.clientX, startTime: clip.start_time, length: clip.end_time - clip.start_time, laneWidth: rect.width, moved: false }
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
