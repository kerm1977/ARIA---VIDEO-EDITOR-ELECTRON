import type { BaseEditorState } from './state'
import { onUnmounted } from 'vue'

export function useEditorPlayback(state: BaseEditorState) {
  let raf = 0
  let last = performance.now()

  function tick(now: number) {
    const delta = (now - last) / 1000
    last = now
    if (state.isPlaying && state.currentProject) {
      const duration = state.currentProject.duration || 0
      if (state.currentTime < duration) {
        state.currentTime = Math.min(state.currentTime + delta, duration)
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
    const clip = state.previewClip || state.findClipAtOrAfter(state.currentTime)
    if (clip && !state.previewClip) {
      state.currentTime = clip.start_time
    }
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
