const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  dialogOpen: (options) => ipcRenderer.invoke('dialog:open', options),
  dialogSave: (options) => ipcRenderer.invoke('dialog:save', options),
  getVideoMetadata: (path) => ipcRenderer.invoke('video:metadata', path),
  getAudioMetadata: (path) => ipcRenderer.invoke('audio:metadata', path),
  generateProxy: (path, settings, useGPU) => ipcRenderer.invoke('video:proxy', path, settings, useGPU),
  convertVideo: (path, settings) => ipcRenderer.invoke('video:convert', path, settings),
  exportVideo: (project, outputPath) => ipcRenderer.invoke('video:export', project, outputPath),
  pathToUrl: (path) => ipcRenderer.invoke('path:to-url', path),
  fileStat: (path) => ipcRenderer.invoke('file:stat', path),
  getSystemPerformance: () => ipcRenderer.invoke('system:performance'),
  checkFFmpegGPUSupport: () => ipcRenderer.invoke('ffmpeg:gpu-check'),
  detectScenes: (path) => ipcRenderer.invoke('video:scene-detect', path),
  analyzeAudio: (path) => ipcRenderer.invoke('video:audio-analyze', path),
  stabilizeVideo: (path, outputPath) => ipcRenderer.invoke('video:stabilize', path, outputPath),
  enhanceVideo: (path, outputPath, settings) => ipcRenderer.invoke('video:enhance', path, outputPath, settings),
  denoiseVideo: (path, outputPath) => ipcRenderer.invoke('video:denoise', path, outputPath),
  onConversionProgress: (callback) => ipcRenderer.on('conversion-progress', (event, data) => callback(data)),
  saveProjectData: (data) => ipcRenderer.invoke('saveProjectData', data),
  loadProjectData: () => ipcRenderer.invoke('loadProjectData'),
  showItemInFolder: (path) => ipcRenderer.invoke('showItemInFolder', path)
})
