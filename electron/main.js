import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, exec } from 'child_process'
import fs from 'fs'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = !app.isPackaged

// System performance detection
function detectSystemPerformance() {
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const platform = os.platform()
  
  return {
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model || 'Unknown',
    totalMemory: totalMemory,
    freeMemory: freeMemory,
    platform: platform,
    arch: os.arch(),
    gpuAcceleration: detectGPUAcceleration(platform)
  }
}

function detectGPUAcceleration(platform) {
  if (platform === 'darwin') {
    return 'videotoolbox' // macOS VideoToolbox
  } else if (platform === 'win32') {
    return 'd3d11va' // Windows DirectX 11
  } else {
    return 'vaapi' // Linux VAAPI
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Dialog IPC
ipcMain.handle('dialog:open', async (_, options) => {
  const result = await dialog.showOpenDialog(options)
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:save', async (_, options) => {
  const result = await dialog.showSaveDialog(options)
  return result.canceled ? null : result.filePath
})

// Video metadata IPC
ipcMain.handle('video:metadata', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,codec_name,r_frame_rate,duration',
      '-show_entries', 'format=bit_rate,size',
      '-of', 'json',
      filePath
    ])
    let output = ''
    let error = ''
    ffprobe.stdout.on('data', (data) => { output += data })
    ffprobe.stderr.on('data', (data) => { error += data })
    ffprobe.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffprobe failed')
      try {
        const json = JSON.parse(output)
        const stream = json.streams?.[0] || {}
        const format = json.format || {}
        const fpsStr = stream.r_frame_rate || '30/1'
        const fps = fpsStr.includes('/') ? parseFloat(fpsStr.split('/')[0]) / parseFloat(fpsStr.split('/')[1]) : parseFloat(fpsStr)
        resolve({
          duration: parseFloat(stream.duration || format.duration || 0),
          width: stream.width || 1920,
          height: stream.height || 1080,
          fps: isNaN(fps) ? 30 : fps,
          codec: stream.codec_name || 'h264',
          bitrate: parseInt(format.bit_rate || 0),
          file_size: parseInt(format.size || 0)
        })
      } catch (e) {
        reject(e.message)
      }
    })
  })
})

// Proxy generation IPC with GPU acceleration
ipcMain.handle('video:proxy', async (_, filePath, settings, useGPU = false) => {
  const dir = path.dirname(filePath)
  const stem = path.basename(filePath, path.extname(filePath))
  const proxyPath = path.join(dir, `${stem}_proxy.mp4`)
  
  const platform = os.platform()
  let gpuArgs = []
  
  if (useGPU) {
    if (platform === 'darwin') {
      gpuArgs = ['-c:v', 'h264_videotoolbox', '-b:v', settings.bitrate]
    } else if (platform === 'win32') {
      gpuArgs = ['-c:v', 'h264_d3d11va', '-b:v', settings.bitrate]
    } else {
      gpuArgs = ['-c:v', 'h264_vaapi', '-vaapi_device', '/dev/dri/renderD128', '-b:v', settings.bitrate]
    }
  }
  
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-vf', `scale=${settings.resolution}`,
      ...(useGPU ? gpuArgs : ['-c:v', settings.codec, '-b:v', settings.bitrate, '-preset', 'fast']),
      '-c:a', 'aac',
      '-b:a', '128k',
      proxyPath,
      '-y'
    ]
    
    const ffmpeg = spawn('ffmpeg', args)
    let error = ''
    ffmpeg.stderr.on('data', (data) => { error += data })
    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffmpeg failed')
      resolve(proxyPath)
    })
  })
})

// Export video IPC
ipcMain.handle('video:export', async (_, project, outputPath) => {
  if (!project.tracks.length || !project.tracks[0].clips.length) {
    throw new Error('No clips to export')
  }
  const sourcePath = project.tracks[0].clips[0].original_path
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', sourcePath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      outputPath,
      '-y'
    ])
    let error = ''
    ffmpeg.stderr.on('data', (data) => { error += data })
    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffmpeg failed')
      resolve(outputPath)
    })
  })
})

// Convert file path to file URL
ipcMain.handle('path:to-url', async (_, filePath) => {
  return 'file://' + filePath
})

// File stats
ipcMain.handle('file:stat', async (_, filePath) => {
  try {
    const stat = fs.statSync(filePath)
    return { size: stat.size }
  } catch (e) {
    return { size: 0 }
  }
})

// System performance detection
ipcMain.handle('system:performance', async () => {
  return detectSystemPerformance()
})

// Check FFmpeg GPU support
ipcMain.handle('ffmpeg:gpu-check', async () => {
  return new Promise((resolve) => {
    exec('ffmpeg -encoders', (error, stdout) => {
      if (error) {
        resolve({ supported: false, encoders: [] })
        return
      }
      const gpuEncoders = []
      if (stdout.includes('h264_nvenc')) gpuEncoders.push('h264_nvenc')
      if (stdout.includes('h264_videotoolbox')) gpuEncoders.push('h264_videotoolbox')
      if (stdout.includes('h264_qsv')) gpuEncoders.push('h264_qsv')
      if (stdout.includes('h264_vaapi')) gpuEncoders.push('h264_vaapi')
      if (stdout.includes('h264_d3d11va')) gpuEncoders.push('h264_d3d11va')
      
      resolve({ supported: gpuEncoders.length > 0, encoders: gpuEncoders })
    })
  })
})

// Scene detection using FFmpeg
ipcMain.handle('video:scene-detect', async (_, filePath) => {
  const dir = path.dirname(filePath)
  const stem = path.basename(filePath, path.extname(filePath))
  const scenesPath = path.join(dir, `${stem}_scenes.json`)
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-vf', 'select=\'gt(scene,0.4)\',showinfo',
      '-f', 'null',
      '-'
    ])
    
    let output = ''
    let error = ''
    
    ffmpeg.stderr.on('data', (data) => {
      output += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        return reject(error || 'Scene detection failed')
      }
      
      // Parse scene timestamps from FFmpeg output
      const scenes = []
      const lines = output.split('\n')
      for (const line of lines) {
        const match = line.match(/pts_time:(\d+\.?\d*)/)
        if (match) {
          scenes.push(parseFloat(match[1]))
        }
      }
      
      resolve({ scenes, count: scenes.length })
    })
  })
})

// Audio analysis using FFmpeg
ipcMain.handle('video:audio-analyze', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-af', 'astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:value=0',
      '-f', 'null',
      '-'
    ])
    
    let output = ''
    let error = ''
    
    ffmpeg.stderr.on('data', (data) => {
      output += data.toString()
    })
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        return reject(error || 'Audio analysis failed')
      }
      
      // Basic audio stats
      resolve({ 
        hasAudio: output.includes('Audio:'),
        duration: extractDuration(output)
      })
    })
  })
})

function extractDuration(output) {
  const match = output.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
  if (match) {
    const hours = parseInt(match[1])
    const mins = parseInt(match[2])
    const secs = parseFloat(match[3])
    return hours * 3600 + mins * 60 + secs
  }
  return 0
}
