import type { BaseEditorState } from './state'
import { onUnmounted } from 'vue'

export function useEditorPlayback(state: BaseEditorState) {
  let raf = 0
  let last = performance.now()
  let lastUpdateTime = 0
  const UPDATE_INTERVAL = 50 // Update currentTime every 50ms (20fps)

  function tick(now: number) {
    const delta = (now - last) / 1000
    last = now
    if (state.isPlaying && state.currentProject) {
      const duration = state.currentProject.duration || 0
      if (state.currentTime < duration) {
        // Only update state.currentTime at intervals to avoid overwhelming Vue reactivity
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          state.currentTime = Math.min(state.currentTime + delta, duration)
          lastUpdateTime = now
        }
      } else {
        state.isPlaying = false
      }
    }
    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  onUnmounted(() => cancelAnimationFrame(raf))

  function handleTogglePlay() {
    if (!state.currentProject) return
    // Don't jump to clip start - continue from current position
    state.videoPreview?.togglePlay()
  }

  function handleTimeUpdate(time: number) {
    state.currentTime = time
  }

  function handlePlayStateChange(playing: boolean) {
    state.isPlaying = playing
  }

  function handleTimelineTimeUpdate(time: number) {
    state.currentTime = time
    state.videoPreview?.seekTo(time)
  }

  return { handleTogglePlay, handleTimeUpdate, handlePlayStateChange, handleTimelineTimeUpdate }
}
