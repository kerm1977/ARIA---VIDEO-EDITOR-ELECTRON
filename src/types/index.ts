export interface Track {
  id: string;
  type: 'video' | 'audio';
  clips: Clip[];
  muted: boolean;
  locked: boolean;
}

export interface Clip {
  id: string;
  file: string;
  startTime: number;
  duration: number;
  offset: number;
  proxyFile?: string;
  isProxy: boolean;
}

export interface Project {
  id: string;
  name: string;
  videoTracks: Track[];
  audioTracks: Track[];
  duration: number;
  fps: number;
  resolution: string;
}

export interface ProxySettings {
  enabled: boolean;
  resolution: string;
  codec: string;
  bitrate: string;
}

export type Theme = 'light' | 'dark';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}
