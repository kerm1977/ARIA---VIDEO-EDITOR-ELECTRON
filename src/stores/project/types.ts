import type { Ref, ComputedRef } from 'vue'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  container: string
  bitrate: number
  file_size: number
  hasAudio: boolean
  audioCodec: string
}

export interface AudioMetadata {
  duration: number
  codec: string
  channels: number
  sample_rate: number
  bitrate: number
  file_size: number
}

export interface ProxySettings {
  enabled: boolean
  resolution: string
  codec: string
  bitrate: string
  useGPU: boolean
}

export interface VideoClip {
  id: string
  original_path: string
  proxy_path?: string
  metadata: VideoMetadata
  start_time: number
  end_time: number
  in_point: number
  out_point: number
  type?: 'video' | 'audio'
  rotation?: number
  mirror?: boolean
  scale?: number
  positionX?: number
  positionY?: number
}

export interface AudioClip {
  id: string
  original_path: string
  metadata: AudioMetadata
  start_time: number
  end_time: number
  in_point: number
  out_point: number
}

export interface TimelineTrack {
  id: string
  name: string
  type: 'video' | 'audio'
  clips: (VideoClip | AudioClip)[]
}

export interface Project {
  id: string
  name: string
  created_at: string
  modified_at: string
  tracks: TimelineTrack[]
  duration: number
  aspectRatio?: string
}

export interface ProjectState {
  currentProject: Ref<Project | null>
  projects: Ref<Project[]>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  proxySettings: Ref<ProxySettings>
  history: Ref<{ currentProject: Project | null; projects: Project[]; proxySettings: ProxySettings }[]>
  historyIndex: Ref<number>
  hasProject: ComputedRef<boolean>
  projectDuration: ComputedRef<number>
}
