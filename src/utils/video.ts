export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

export function getVideoSource(clip: any): string {
  if (!clip) return ''
  const path = clip.proxy_path || clip.original_path
  if (path.startsWith('blob:') || path.startsWith('http')) return path
  if (path.startsWith('file://')) return path
  return 'file://' + path
}

export function getClipStyle(clip: any, duration: number) {
  const left = (clip.start_time / duration) * 100
  const width = ((clip.end_time - clip.start_time) / duration) * 100
  return { left: left + '%', width: width + '%' }
}

export function getClipName(clip: any): string {
  const pathParts = clip.original_path.split('/')
  return pathParts[pathParts.length - 1] || 'Untitled Clip'
}
