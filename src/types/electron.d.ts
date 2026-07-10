export interface ElectronAPI {
  dialogOpen: (options: any) => Promise<string | null>
  dialogSave: (options: any) => Promise<string | null>
  getVideoMetadata: (path: string) => Promise<any>
  generateProxy: (path: string, settings: any, useGPU?: boolean) => Promise<string>
  exportVideo: (project: any, outputPath: string) => Promise<string>
  pathToUrl: (path: string) => Promise<string>
  fileStat: (path: string) => Promise<{ size: number }>
  getSystemPerformance: () => Promise<SystemPerformance>
  checkFFmpegGPUSupport: () => Promise<GPUSupport>
  detectScenes: (path: string) => Promise<SceneDetectionResult>
  analyzeAudio: (path: string) => Promise<AudioAnalysisResult>
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

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
