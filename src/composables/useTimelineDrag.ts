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

export function useTimelineDrag(props: TimelineProps, emit: TimelineEmit, state: { playheadPosition: { value: number }; isDragging: { value: boolean }; effectiveDuration: { value: number } }) {
  const dragClip = ref<{ clip: any | null; trackId: string; startX: number; startTime: number; length: number; laneWidth: number; moved: boolean; originalStartTime: number; dragDirection: 'left' | 'right' | null } | null>(null)
  const dragClips = ref<{ clip: any; trackId: string; originalStartTime: number; length: number }[]>([])

  function onDrag(e: MouseEvent) {
    if (!state.isDragging.value) return
    const timeline = document.querySelector('.timeline')
    if (!timeline) return
    const rect = timeline.getBoundingClientRect()
    const padding = 10
    const x = e.clientX - rect.left - padding
    const contentWidth = rect.width - (padding * 2)
    const newTime = (x / contentWidth) * state.effectiveDuration.value
    state.playheadPosition.value = (newTime / state.effectiveDuration.value) * 100
    emit('timeUpdate', Math.max(0, Math.min(newTime, state.effectiveDuration.value)))
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
    
    // Actualizar dirección del arrastre antes de calcular snap
    if (deltaX > 0) {
      s.dragDirection = 'right'
    } else if (deltaX < 0) {
      s.dragDirection = 'left'
    }
    
    const deltaTime = (deltaX / s.laneWidth) * state.effectiveDuration.value
    let newStart = Math.max(0, s.startTime + deltaTime)
    
    // Aplicar snap en tiempo real para evitar superposición
    const snapPosition = findSnapPosition(s.clip, s.trackId, newStart, s.length, s.dragDirection)
    newStart = Math.max(0, snapPosition) // Asegurar que nunca sea negativo
    
    // Mover el clip principal
    s.clip.start_time = newStart
    s.clip.end_time = newStart + s.length
    s.moved = true
    
    // Empujar clips que se superponen hacia la derecha
    pushOverlappingClips(s.clip, s.trackId, newStart, newStart + s.length)
    
    // Mover todos los clips seleccionados manteniendo posiciones relativas
    if (dragClips.value.length > 0) {
      for (const dragItem of dragClips.value) {
        const relativeOffset = dragItem.originalStartTime - s.originalStartTime
        dragItem.clip.start_time = newStart + relativeOffset
        dragItem.clip.end_time = dragItem.clip.start_time + dragItem.length
      }
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

  function pushOverlappingClips(clip: any, trackId: string, newStart: number, newEnd: number) {
    const track = props.tracks.find(t => t.id === trackId)
    if (!track) return

    const otherClips = track.clips.filter(c => c.id !== clip.id)
    const pushedClips = new Set<string>()

    // Función recursiva para empujar clips en cascada
    function pushClip(clipToPush: any, pushStart: number) {
      if (pushedClips.has(clipToPush.id)) return
      pushedClips.add(clipToPush.id)

      const clipLength = clipToPush.end_time - clipToPush.start_time
      const newClipStart = Math.max(pushStart, clipToPush.start_time)
      const newClipEnd = newClipStart + clipLength

      clipToPush.start_time = newClipStart
      clipToPush.end_time = newClipEnd
      emit('move-clip', clipToPush.id, newClipStart)

      // Verificar si este clip ahora superpone otros clips y empujarlos también
      for (const otherClip of otherClips) {
        if (otherClip.id === clipToPush.id) continue
        if (newClipStart < otherClip.end_time && newClipEnd > otherClip.start_time) {
          // Hay superposición, empujar el otro clip
          pushClip(otherClip, newClipEnd)
        }
      }
    }

    // Encontrar clips que se superponen y empujarlos
    for (const otherClip of otherClips) {
      if (newStart < otherClip.end_time && newEnd > otherClip.start_time) {
        // Hay superposición, empujar este clip hacia la derecha
        pushClip(otherClip, newEnd)
      }
    }
  }

  function findSnapPosition(clip: any, trackId: string, newStart: number, clipLength: number, dragDirection: 'left' | 'right' | null): number {
    const track = props.tracks.find(t => t.id === trackId)
    if (!track) return newStart

    const otherClips = track.clips.filter(c => c.id !== clip.id)
    const newEnd = newStart + clipLength

    // Verificar si hay superposición y hacer snap inmediatamente para evitarla
    for (const otherClip of otherClips) {
      if (newStart < otherClip.end_time && newEnd > otherClip.start_time) {
        // Hay superposición - hacer snap basado en la dirección del arrastre
        if (dragDirection === 'right') {
          // Si arrastramos a la derecha, pegar al lado derecho del clip superpuesto
          return otherClip.end_time
        } else if (dragDirection === 'left') {
          // Si arrastramos a la izquierda, pegar al lado izquierdo del clip superpuesto
          // Asegurar que nunca sea negativo (no puede ir antes del segundo 0)
          return Math.max(0, otherClip.start_time - clipLength)
        } else {
          // Sin dirección clara, elegir el borde más cercano
          const distanceToLeft = newStart - otherClip.start_time
          const distanceToRight = otherClip.end_time - newEnd
          if (Math.abs(distanceToLeft) < Math.abs(distanceToRight)) {
            return Math.max(0, otherClip.start_time - clipLength)
          } else {
            return otherClip.end_time
          }
        }
      }
    }
    
    // Si no hay superposición, verificar snap suave cuando está muy cerca
    const snapThreshold = 0.1
    let closestLeftClip = null
    let minLeftDistance = Infinity
    for (const otherClip of otherClips) {
      if (otherClip.end_time <= newStart) {
        const distance = newStart - otherClip.end_time
        if (distance < minLeftDistance) {
          minLeftDistance = distance
          closestLeftClip = otherClip
        }
      }
    }

    let closestRightClip = null
    let minRightDistance = Infinity
    for (const otherClip of otherClips) {
      if (otherClip.start_time >= newEnd) {
        const distance = otherClip.start_time - newEnd
        if (distance < minRightDistance) {
          minRightDistance = distance
          closestRightClip = otherClip
        }
      }
    }

    if (closestLeftClip && minLeftDistance < snapThreshold && minLeftDistance <= minRightDistance) {
      return closestLeftClip.end_time
    }
    if (closestRightClip && minRightDistance < snapThreshold && minRightDistance < minLeftDistance) {
      return closestRightClip.start_time - clipLength
    }
    
    return newStart
  }

  function stopClipDrag() {
    if (dragClip.value && dragClip.value.clip) {
      if (dragClip.value.moved) {
        // Aplicar snap final para asegurar que no haya superposición
        const snapPosition = findSnapPosition(dragClip.value.clip, dragClip.value.trackId, dragClip.value.clip.start_time, dragClip.value.length, dragClip.value.dragDirection)
        const finalPosition = Math.max(0, snapPosition) // Asegurar que nunca sea negativo
        const delta = finalPosition - dragClip.value.clip.start_time
        dragClip.value.clip.start_time = finalPosition
        dragClip.value.clip.end_time = finalPosition + dragClip.value.length
        emit('move-clip', dragClip.value.clip.id, finalPosition)
        
        // Empujar clips que se superponen hacia la derecha (final)
        pushOverlappingClips(dragClip.value.clip, dragClip.value.trackId, finalPosition, finalPosition + dragClip.value.length)
        
        // Aplicar el mismo delta a todos los clips seleccionados
        for (const dragItem of dragClips.value) {
          dragItem.clip.start_time += delta
          dragItem.clip.end_time += delta
          emit('move-clip', dragItem.clip.id, dragItem.clip.start_time)
        }
        
        // Re-emitir selección para mantener visualización
        const allSelectedClips = [dragClip.value.clip, ...dragClips.value.map(d => d.clip)]
        emit('select-clips', allSelectedClips as VideoClip[])
      }
      dragClip.value = null
      dragClips.value = []
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
    
    // Capturar todos los clips seleccionados para movimiento simultáneo
    const selectedClips = props.selectedClips || []
    if (selectedClips.length > 1) {
      dragClips.value = selectedClips
        .filter(c => c.id !== clip.id)
        .map(c => ({
          clip: c,
          trackId: trackId,
          originalStartTime: c.start_time,
          length: c.end_time - c.start_time
        }))
    } else {
      dragClips.value = []
    }
    
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onClipDrag)
    document.addEventListener('mouseup', stopClipDrag)
  }

  function startClipDragImmediate(e: MouseEvent, clip: any, trackId: string) {
    if (e.button !== 0) return
    e.stopPropagation()
    emit('select-clips', [clip as VideoClip])
    const lane = (e.currentTarget as HTMLElement).parentElement
    const rect = lane?.getBoundingClientRect()
    if (!rect) return
    dragClip.value = { clip, trackId, startX: e.clientX, startTime: clip.start_time, length: clip.end_time - clip.start_time, laneWidth: rect.width, moved: false, originalStartTime: clip.start_time, dragDirection: null }
    dragClips.value = []
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
    startClipDragImmediate,
    onClipDrag,
    stopClipDrag
  }
}
