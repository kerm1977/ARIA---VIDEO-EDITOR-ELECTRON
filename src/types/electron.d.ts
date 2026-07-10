export interface ElectronAPI {
  dialogOpen: (options: any) => Promise<string | null>
  dialogSave: (options: any) => Promise<string | null>
  getVideoMetadata: (path: string) => Promise<any>
  getAudioMetadata: (path: string) => Promise<AudioMetadata>
  generateProxy: (path: string, settings: any, useGPU?: boolean) => Promise<string>
  convertVideo: (path: string, settings: any) => Promise<string>
  exportVideo: (project: any, outputPath: string) => Promise<string>
  pathToUrl: (path: string) => Promise<string>
  fileStat: (path: string) => Promise<{ size: number }>
  getSystemPerformance: () => Promise<EnhancedSystemPerformance>
  checkFFmpegGPUSupport: () => Promise<GPUSupport>
  detectScenes: (path: string) => Promise<SceneDetectionResult>
  analyzeAudio: (path: string) => Promise<AudioAnalysisResult>
  stabilizeVideo: (path: string, outputPath: string) => Promise<string>
  enhanceVideo: (path: string, outputPath: string, settings: any) => Promise<string>
  denoiseVideo: (path: string, outputPath: string) => Promise<string>
  onConversionProgress: (callback: (data: { progress: number, message: string }) => void) => void
  saveProjectData: (data: string) => Promise<boolean>
  loadProjectData: () => Promise<string | null>
}

export interface SystemPerformance {
  cpuCount: number
  cpuModel: string
  totalMemory: number
  freeMemory: number
  platform: string
  arch: string
  gpuAcceleration: string
}

export interface EnhancedSystemPerformance {
  cpuCount: number
  cpuModel: string
  cpuSpeed: number
  cpuUsage: number
  totalMemory: number
  freeMemory: number
  usedMemory: number
  memoryUsagePercent: number
  platform: string
  arch: string
  gpuInfo: GPUInfo
  audioInfo: AudioInfo
  timestamp: number
}

export interface GPUInfo {
  available: boolean
  type: string
  vendor: string
  api: string
  memory: number
}

export interface AudioInfo {
  inputDevices: number
  outputDevices: number
  defaultInput: string
  defaultOutput: string
  sampleRates: number[]
  bufferSize: number
}

export interface GPUSupport {
  supported: boolean
  encoders: string[]
}

export interface SceneDetectionResult {
  scenes: number[]
  count: number
}

export interface AudioAnalysisResult {
  hasAudio: boolean
  duration: number
}

export interface AudioMetadata {
  duration: number
  codec: string
  channels: number
  sample_rate: number
  bitrate: number
  file_size: number
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
