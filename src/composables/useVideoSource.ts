import { ref } from 'vue'
import { getVideoSource } from '../utils/video'
import type { VideoClip } from '../stores/project'

export function useVideoSource() {
  const videoSource = ref('')

  function toPlainPath(p: string): string {
    if (p.startsWith('file://')) return p.slice(7)
    if (p.startsWith('local-video://')) return p.slice(14)
    return p
  }

  async function findExistingPath(clip: VideoClip | null): Promise<string | null> {
    if (!clip) return null
    const electron = typeof window !== 'undefined' && (window as any).electronAPI
    const candidates = [clip.proxy_path, clip.original_path].filter((p): p is string => !!p)
    if (!electron) return candidates[0] || null
    for (const p of candidates) {
      if (p.startsWith('blob:') || p.startsWith('http')) return p
      try {
        const stat = await electron.fileStat(toPlainPath(p))
        if (stat && stat.size > 0) return p
      } catch (e) {}
    }
    return null
  }

  let lastOriginal = ''
  let lastProxy = ''

  async function resolveVideoSource(clip: VideoClip | null) {
    if (!clip) {
      videoSource.value = ''
      lastOriginal = ''
      lastProxy = ''
      return
    }
    if (clip.original_path === lastOriginal && clip.proxy_path === lastProxy) {
      return
    }
    videoSource.value = ''
    const resolved = await findExistingPath(clip)
    videoSource.value = resolved ? getVideoSource({ original_path: resolved }) : ''
    lastOriginal = clip.original_path
    lastProxy = clip.proxy_path
  }

  return { videoSource, resolveVideoSource }
}
