import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { VideoClip } from '../stores/project'

export function usePreviewTransform(props: {
  currentClip: VideoClip | null
  selectedClip?: VideoClip | null
  activeTool?: 'rotate' | 'scale' | 'move' | null
}, emit: {
  (e: 'rotate', angle: number): void
  (e: 'rotateCommit', angle: number): void
  (e: 'scale', scale: number): void
  (e: 'scaleCommit', scale: number): void
  (e: 'position', x: number, y: number): void
  (e: 'positionCommit', x: number, y: number): void
}) {
  const currentTool = ref<'rotate' | 'scale' | 'move' | null>(null)
  let isMiddleDragging = false
  let startX = 0
  let startY = 0
  let lastMouseX = 0
  let lastMouseY = 0
  let lastShiftKey = false
  let lastCtrlKey = false
  let initialRotation = 0
  let initialScale = 1
  let initialPosX = 0
  let initialPosY = 0

  const transformTarget = computed(() => (props.selectedClip && (props.selectedClip.metadata as any).width != null) ? props.selectedClip : props.currentClip)

  function captureInitials(clip: any) {
    if (!clip) return
    initialRotation = clip.rotation || 0
    initialScale = clip.scale || 1
    initialPosX = clip.positionX || 0
    initialPosY = clip.positionY || 0
  }

  function startTool(tool: 'rotate' | 'scale' | 'move', x: number, y: number) {
    currentTool.value = tool
    startX = x
    startY = y
    captureInitials(transformTarget.value)
  }

  function updateTool(dx: number, dy: number, shift: boolean, ctrl: boolean) {
    const clip = transformTarget.value as any
    if (!clip || !currentTool.value) return
    const snap = ctrl && shift
    const slow = shift && !ctrl
    if (currentTool.value === 'rotate') {
      const angle = snap ? Math.round((initialRotation + dx * (slow ? 0.1 : 0.5)) / 5) * 5 : initialRotation + dx * (slow ? 0.1 : 0.5)
      emit('rotate', angle)
    } else if (currentTool.value === 'scale') {
      const val = initialScale - dy * (slow ? 0.001 : 0.005)
      const clamped = Math.min(5, Math.max(0.1, val))
      const scale = snap ? Math.round(clamped / 0.05) * 0.05 : clamped
      emit('scale', scale)
    } else if (currentTool.value === 'move') {
      const mult = slow ? 0.2 : 1
      const posX = snap ? Math.round((initialPosX + dx * mult) / 5) * 5 : initialPosX + dx * mult
      const posY = snap ? Math.round((initialPosY + dy * mult) / 5) * 5 : initialPosY + dy * mult
      emit('position', posX, posY)
    }
  }

  function commitTool() {
    const clip = transformTarget.value as any
    if (!clip || !currentTool.value) return
    const dx = lastMouseX - startX
    const dy = lastMouseY - startY
    const snap = lastCtrlKey && lastShiftKey
    const slow = lastShiftKey && !lastCtrlKey
    if (currentTool.value === 'rotate') {
      const angle = snap ? Math.round((initialRotation + dx * (slow ? 0.1 : 0.5)) / 5) * 5 : initialRotation + dx * (slow ? 0.1 : 0.5)
      emit('rotateCommit', angle)
    } else if (currentTool.value === 'scale') {
      const val = initialScale - dy * (slow ? 0.001 : 0.005)
      const clamped = Math.min(5, Math.max(0.1, val))
      const scale = snap ? Math.round(clamped / 0.05) * 0.05 : clamped
      emit('scaleCommit', scale)
    } else if (currentTool.value === 'move') {
      const mult = slow ? 0.2 : 1
      const posX = snap ? Math.round((initialPosX + dx * mult) / 5) * 5 : initialPosX + dx * mult
      const posY = snap ? Math.round((initialPosY + dy * mult) / 5) * 5 : initialPosY + dy * mult
      emit('positionCommit', posX, posY)
    }
    currentTool.value = null
    document.body.style.userSelect = ''
  }

  function onMouseDown(e: MouseEvent) {
    if (!transformTarget.value) return
    if (props.activeTool) { e.preventDefault(); return }
    if (e.button === 1) {
      e.preventDefault()
      startTool('move', e.clientX, e.clientY)
      isMiddleDragging = true
      document.body.style.userSelect = 'none'
    }
  }

  function onMouseMove(e: MouseEvent) {
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    lastShiftKey = e.shiftKey
    lastCtrlKey = e.ctrlKey
    if (!transformTarget.value) return
    if (isMiddleDragging && currentTool.value) {
      updateTool(e.clientX - startX, e.clientY - startY, e.shiftKey, e.ctrlKey)
    } else if (props.activeTool) {
      if (!currentTool.value) startTool(props.activeTool, e.clientX, e.clientY)
      if (currentTool.value) updateTool(e.clientX - startX, e.clientY - startY, e.shiftKey, e.ctrlKey)
    }
  }

  function onMouseUp(e: MouseEvent) {
    if (!transformTarget.value) return
    if (isMiddleDragging && e.button === 1 && currentTool.value === 'move') {
      onMouseMove(e)
      commitTool()
      isMiddleDragging = false
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName || ''
    if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(tag)) return
    if (e.code === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (currentTool.value === 'scale') currentTool.value = null
      emit('scaleCommit', 1)
    }
  }

  const videoStyle = computed(() => {
    const clip = transformTarget.value as any
    if (!clip) return {}
    const angle = clip.rotation || 0
    const mirror = clip.mirror ? -1 : 1
    const scale = clip.scale || 1
    const posX = clip.positionX || 0
    const posY = clip.positionY || 0
    return { transform: `translate(${posX}px, ${posY}px) rotate(${angle}deg) scale(${scale}) scaleX(${mirror})` }
  })

  const transformInfo = computed(() => {
    const clip = transformTarget.value as any
    if (!clip || (!currentTool.value && !props.activeTool)) return ''
    const tool = currentTool.value || props.activeTool
    if (tool === 'rotate') return `Rotación: ${(clip.rotation || 0).toFixed(1)}°`
    if (tool === 'scale') return `Escala: ${((clip.scale || 1) * 100).toFixed(0)}%`
    if (tool === 'move') return `X: ${(clip.positionX || 0).toFixed(0)}px  Y: ${(clip.positionY || 0).toFixed(0)}px`
    return ''
  })

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown, true)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })

  watch(() => props.activeTool, (newTool, oldTool) => {
    if (oldTool && currentTool.value === oldTool && transformTarget.value) {
      commitTool()
    }
    if (!newTool) {
      currentTool.value = null
    }
  })

  return {
    currentTool,
    videoStyle,
    transformInfo,
    onMouseDown
  }
}
