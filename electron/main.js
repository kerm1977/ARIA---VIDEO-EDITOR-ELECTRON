import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, exec, execSync } from 'child_process'
import fs from 'fs'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Native video engine (C++ with FFmpeg)
let videoEngine = null
try {
  videoEngine = await import('../native/index.js')
  console.log('Native video engine loaded successfully')
} catch (error) {
  console.warn('Native video engine not available, falling back to FFmpeg CLI:', error.message)
}

const isDev = !app.isPackaged

// Enhanced system performance detection
function detectSystemPerformance() {
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const platform = os.platform()
  const arch = os.arch()

  // Calculate CPU usage
  const cpuUsage = calculateCPUUsage()

  // Detect GPU capabilities
  const gpuInfo = detectGPUCapabilities(platform)

  // Detect audio capabilities
  const audioInfo = detectAudioCapabilities()

  return {
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuSpeed: cpus[0]?.speed || 0,
    cpuUsage: cpuUsage,
    totalMemory: totalMemory,
    freeMemory: freeMemory,
    usedMemory: totalMemory - freeMemory,
    memoryUsagePercent: ((totalMemory - freeMemory) / totalMemory) * 100,
    platform: platform,
    arch: arch,
    gpuInfo: gpuInfo,
    audioInfo: audioInfo,
    timestamp: Date.now()
  }
}

function calculateCPUUsage() {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  })

  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - ~~(100 * idle / total)

  return usage
}

function detectGPUCapabilities(platform) {
  const gpuInfo = {
    available: false,
    type: 'unknown',
    vendor: 'unknown',
    api: 'none',
    memory: 0
  }

  if (platform === 'darwin') {
    // macOS - Metal and VideoToolbox
    gpuInfo.available = true
    gpuInfo.type = 'integrated'
    gpuInfo.vendor = 'Apple'
    gpuInfo.api = 'metal'
    gpuInfo.memory = detectMacOSGPUMemory()
  } else if (platform === 'win32') {
    // Windows - DirectX 11/12
    gpuInfo.available = true
    gpuInfo.api = 'directx'
    gpuInfo.type = detectWindowsGPUType()
    gpuInfo.vendor = detectWindowsGPUVendor()
  } else {
    // Linux - VAAPI, Vulkan
    gpuInfo.available = detectLinuxGPU()
    gpuInfo.api = 'vaapi'
    gpuInfo.type = detectLinuxGPUType()
    gpuInfo.vendor = detectLinuxGPUVendor()
  }

  return gpuInfo
}

function detectMacOSGPUMemory() {
  try {
    // Try to get GPU memory from system_profiler
    const result = execSync('system_profiler SPDisplaysDataType 2>/dev/null | grep "VRAM" | head -1')
    const match = result.toString().match(/(\d+)\s*(GB|MB)/i)
    if (match) {
      const value = parseInt(match[1])
      const unit = match[2].toUpperCase()
      return unit === 'GB' ? value * 1024 : value
    }
  } catch (e) {
    // Fallback to estimated value
  }
  return 0
}

function detectWindowsGPUType() {
  try {
    const result = execSync('wmic path win32_VideoController get AdapterRAM 2>/dev/null')
    const memory = parseInt(result.toString().split('\n')[1]?.trim() || '0')
    return memory > 4000 ? 'discrete' : 'integrated'
  } catch (e) {
    return 'unknown'
  }
}

function detectWindowsGPUVendor() {
  try {
    const result = execSync('wmic path win32_VideoController get Name 2>/dev/null')
    const name = result.toString().toLowerCase()
    if (name.includes('nvidia')) return 'nvidia'
    if (name.includes('amd') || name.includes('radeon')) return 'amd'
    if (name.includes('intel')) return 'intel'
  } catch (e) {
    // Ignore
  }
  return 'unknown'
}

function detectLinuxGPU() {
  try {
    // Check for VAAPI support
    execSync(' vainfo 2>/dev/null', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function detectLinuxGPUType() {
  try {
    const result = execSync('lspci | grep -i vga 2>/dev/null')
    const output = result.toString().toLowerCase()
    if (output.includes('nvidia')) return 'discrete'
    if (output.includes('amd') || output.includes('radeon')) return 'discrete'
    if (output.includes('intel')) return 'integrated'
  } catch (e) {
    // Ignore
  }
  return 'unknown'
}

function detectLinuxGPUVendor() {
  try {
    const result = execSync('lspci | grep -i vga 2>/dev/null')
    const output = result.toString().toLowerCase()
    if (output.includes('nvidia')) return 'nvidia'
    if (output.includes('amd') || output.includes('radeon')) return 'amd'
    if (output.includes('intel')) return 'intel'
  } catch (e) {
    // Ignore
  }
  return 'unknown'
}

function detectAudioCapabilities() {
  const audioInfo = {
    inputDevices: 0,
    outputDevices: 0,
    defaultInput: 'none',
    defaultOutput: 'none',
    sampleRates: [44100, 48000, 96000],
    bufferSize: 512
  }

  try {
    if (os.platform() === 'darwin') {
      // macOS audio detection
      const result = execSync('system_profiler SPAudioDataType 2>/dev/null')
      const output = result.toString()
      audioInfo.inputDevices = (output.match(/Input Devices:/gi) || []).length
      audioInfo.outputDevices = (output.match(/Output Devices:/gi) || []).length
    } else if (os.platform() === 'win32') {
      // Windows audio detection
      const result = execSync('powershell "Get-WmiObject Win32_SoundDevice | Select Name" 2>/dev/null')
      audioInfo.outputDevices = result.toString().split('\n').filter(l => l.trim()).length - 1
    } else {
      // Linux audio detection (ALSA/PulseAudio)
      try {
        execSync('aplay -l 2>/dev/null', { stdio: 'ignore' })
        audioInfo.outputDevices = 1
      } catch (e) {
        // Try PulseAudio
        try {
          execSync('pactl list sinks 2>/dev/null', { stdio: 'ignore' })
          audioInfo.outputDevices = 1
        } catch (e2) {
          // No audio detected
        }
      }
    }
  } catch (e) {
    // Use defaults
  }

  return audioInfo
}

function createWindow() {
  console.log('Creating Electron window...')
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

  console.log('Window created, loading URL...')
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174')
    mainWindow.webContents.openDevTools()
    console.log('DevTools opened')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    console.log('Window closed')
  })
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
  // Use native engine if available
  if (videoEngine) {
    try {
      const meta = await videoEngine.getMetadata(filePath)
      return {
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
        codec: meta.codec,
        container: meta.container,
        bitrate: meta.bitrate,
        has_audio: meta.hasAudio,
        audio_channels: meta.audioChannels,
        audio_sample_rate: meta.audioSampleRate,
        audio_codec: meta.audioCodec
      }
    } catch (error) {
      console.warn('Native metadata failed, falling back to ffprobe:', error)
    }
  }

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

// Audio metadata IPC
ipcMain.handle('audio:metadata', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name,channels,sample_rate,duration',
      '-show_entries', 'format=bit_rate,size,duration',
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
        resolve({
          duration: parseFloat(stream.duration || format.duration || 0),
          codec: stream.codec_name || 'aac',
          channels: stream.channels || 2,
          sample_rate: parseInt(stream.sample_rate || 44100),
          bitrate: parseInt(format.bit_rate || 0),
          file_size: parseInt(format.size || 0)
        })
      } catch (e) {
        reject(e.message)
      }
    })
  })
})

// Video conversion IPC for format compatibility
ipcMain.handle('video:convert', async (event, filePath, settings) => {
  const dir = path.dirname(filePath)
  const stem = path.basename(filePath, path.extname(filePath))
  const outputPath = path.join(dir, `${stem}_converted.mp4`)

  console.log('Converting video:', filePath, '->', outputPath)

  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-c:v', settings.videoCodec || 'h264',
      '-c:a', settings.audioCodec || 'aac',
      '-b:v', settings.videoBitrate ? settings.videoBitrate.toString() : '2M',
      '-b:a', settings.audioBitrate ? settings.audioBitrate.toString() : '128k',
      '-preset', 'fast',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let error = ''
    let duration = 0
    let lastProgress = 0

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString()
      error += output

      // Parse duration from stderr
      const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
      if (durationMatch && duration === 0) {
        const hours = parseInt(durationMatch[1])
        const mins = parseInt(durationMatch[2])
        const secs = parseFloat(durationMatch[3])
        duration = hours * 3600 + mins * 60 + secs
        console.log('Video duration:', duration, 'seconds')
      }

      // Parse progress from stderr - look for time= pattern
      const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (timeMatch && duration > 0) {
        const hours = parseInt(timeMatch[1])
        const mins = parseInt(timeMatch[2])
        const secs = parseFloat(timeMatch[3])
        const currentTime = hours * 3600 + mins * 60 + secs
        const progress = Math.min((currentTime / duration) * 100, 100)

        // Only send progress if it changed significantly
        if (progress - lastProgress > 1 || progress === 100) {
          lastProgress = progress
          console.log('Conversion progress:', Math.round(progress) + '%')
          event.sender.send('conversion-progress', { progress, message: `Converting: ${Math.round(progress)}%` })
        }
      }
    })

    ffmpeg.on('close', (code) => {
      console.log('FFmpeg closed with code:', code)
      if (code !== 0) {
        console.error('FFmpeg error:', error)
        return reject(error || 'FFmpeg conversion failed')
      }
      event.sender.send('conversion-progress', { progress: 100, message: 'Conversion complete' })
      resolve(outputPath)
    })

    ffmpeg.on('error', (err) => {
      console.error('FFmpeg spawn error:', err)
      reject(err.message)
    })
  })
})

// Proxy generation IPC with enhanced GPU acceleration
ipcMain.handle('video:proxy', async (_, filePath, settings, useGPU = false) => {
  const dir = path.dirname(filePath)
  const stem = path.basename(filePath, path.extname(filePath))
  const proxyPath = path.join(dir, `${stem}_proxy.mp4`)

  console.log('Generating proxy:', filePath, '->', proxyPath)

  // Use native video engine if available
  if (videoEngine) {
    try {
      const resolution = settings.resolution || '1280:720'
      const [width, height] = resolution.split(':').map(Number)
      const nativeSettings = {
        width: width || 1280,
        height: height || 720,
        videoCodec: settings.codec || 'h264',
        audioCodec: 'aac',
        videoBitrate: settings.bitrate ? parseInt(settings.bitrate) * 1000 : 2000000,
        audioBitrate: 128000,
        useGPU: useGPU || false
      }
      const result = await videoEngine.generateProxy(filePath, proxyPath, nativeSettings)
      console.log('Native proxy generated successfully:', result)
      return result
    } catch (error) {
      console.warn('Native proxy generation failed, falling back to FFmpeg CLI:', error)
    }
  }

  const platform = os.platform()
  let gpuArgs = []

  if (useGPU) {
    if (platform === 'darwin') {
      // macOS - VideoToolbox (Metal backend)
      gpuArgs = [
        '-c:v', 'h264_videotoolbox',
        '-b:v', settings.bitrate,
        '-profile:v', 'high',
        '-level', '4.0'
      ]
    } else if (platform === 'win32') {
      // Windows - DirectX 11 Video Acceleration
      gpuArgs = [
        '-c:v', 'h264_d3d11va',
        '-b:v', settings.bitrate,
        '-profile:v', 'high',
        '-level', '4.0'
      ]
    } else {
      // Linux - VAAPI (Vulkan backend when available)
      const hasVulkan = checkVulkanSupport()
      if (hasVulkan) {
        gpuArgs = [
          '-c:v', 'h264_vaapi',
          '-vaapi_device', '/dev/dri/renderD128',
          '-b:v', settings.bitrate,
          '-profile:v', 'high',
          '-level', '4.0'
        ]
      } else {
        // Fallback to software encoding
        gpuArgs = ['-c:v', settings.codec, '-b:v', settings.bitrate, '-preset', 'fast']
      }
    }
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-vf', `scale=${settings.resolution}`,
      ...(useGPU ? gpuArgs : ['-c:v', settings.codec, '-b:v', settings.bitrate, '-preset', 'fast']),
      '-c:a', 'aac',
      '-ac', '2',
      '-ar', '44100',
      '-b:a', '128k',
      '-movflags', '+faststart',
      proxyPath,
      '-y'
    ]

    console.log('FFmpeg args:', args)

    const ffmpeg = spawn('ffmpeg', args)
    let error = ''
    let output = ''

    ffmpeg.stdout.on('data', (data) => { output += data })
    ffmpeg.stderr.on('data', (data) => { error += data })

    ffmpeg.on('close', (code) => {
      console.log('FFmpeg closed with code:', code)
      if (code !== 0) {
        console.error('FFmpeg error:', error)
        return reject(error || 'ffmpeg failed')
      }

      // Verify proxy file exists
      if (!fs.existsSync(proxyPath)) {
        return reject('Proxy file was not created')
      }

      console.log('Proxy generated successfully:', proxyPath)
      resolve(proxyPath)
    })
  })
})

// Check Vulkan support on Linux
function checkVulkanSupport() {
  try {
    execSync('vulkaninfo 2>/dev/null', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

// Check Metal support on macOS
function checkMetalSupport() {
  try {
    execSync('system_profiler SPDisplaysDataType 2>/dev/null | grep -i metal', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

// Check DirectX support on Windows
function checkDirectXSupport() {
  try {
    execSync('dxdiag /t dxdiag_output.txt 2>/dev/null', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

// AI-powered scene detection using FFmpeg
ipcMain.handle('video:scene-detect', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    const scenes = []
    const args = [
      '-i', filePath,
      '-vf', 'select=\'gt(scene,0.4)\',showinfo',
      '-f', 'null',
      '-'
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let output = ''
    let error = ''

    ffmpeg.stderr.on('data', (data) => {
      output += data.toString()
      // Parse scene detection output
      const matches = output.matchAll(/pts_time:(\d+\.?\d*)/g)
      for (const match of matches) {
        const time = parseFloat(match[1])
        if (!scenes.includes(time)) {
          scenes.push(time)
        }
      }
    })

    ffmpeg.on('close', (code) => {
      if (code !== 0 && !output) return reject(error || 'ffmpeg failed')
      resolve({
        scenes: scenes.sort((a, b) => a - b),
        count: scenes.length
      })
    })
  })
})

// AI-powered audio analysis using FFmpeg
ipcMain.handle('video:audio-analyze', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-af', 'astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-',
      '-f', 'null',
      '-'
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let output = ''
    let error = ''

    ffmpeg.stderr.on('data', (data) => {
      output += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code !== 0 && !output) return reject(error || 'ffmpeg failed')

      // Parse audio levels
      const levels = output.matchAll(/lavfi\.astats\.Overall\.RMS_level=([-\d\.]+)/g)
      const rmsValues = []
      for (const match of levels) {
        rmsValues.push(parseFloat(match[1]))
      }

      const avgRMS = rmsValues.length > 0
        ? rmsValues.reduce((sum, val) => sum + val, 0) / rmsValues.length
        : 0

      const maxRMS = rmsValues.length > 0
        ? Math.max(...rmsValues)
        : 0

      resolve({
        hasAudio: rmsValues.length > 0,
        avgRMS: avgRMS,
        maxRMS: maxRMS,
        dynamicRange: maxRMS - avgRMS,
        duration: rmsValues.length
      })
    })
  })
})

// AI-powered video stabilization
ipcMain.handle('video:stabilize', async (_, filePath, outputPath) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-vf', 'vidstabdetect=shakiness=10:accuracy=15:result=transforms.trf',
      '-f', 'null',
      '-'
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let error = ''

    ffmpeg.stderr.on('data', (data) => { error += data })

    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffmpeg failed')

      // Apply stabilization
      const stabilizeArgs = [
        '-i', filePath,
        '-vf', 'vidstabtransform=smoothing=30:input=transforms.trf,crop=black',
        '-c:a', 'copy',
        outputPath,
        '-y'
      ]

      const ffmpeg2 = spawn('ffmpeg', stabilizeArgs)
      let error2 = ''

      ffmpeg2.stderr.on('data', (data) => { error2 += data })

      ffmpeg2.on('close', (code2) => {
        if (code2 !== 0) return reject(error2 || 'ffmpeg failed')
        resolve(outputPath)
      })
    })
  })
})

// AI-powered quality enhancement
ipcMain.handle('video:enhance', async (_, filePath, outputPath, settings) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-vf', `scale=${settings.resolution}:flags=lanczos,unsharp=5:5:1.0:5:5:0.0`,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', settings.crf || '18',
      '-c:a', 'copy',
      outputPath,
      '-y'
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let error = ''

    ffmpeg.stderr.on('data', (data) => { error += data })

    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffmpeg failed')
      resolve(outputPath)
    })
  })
})

// AI-powered noise reduction
ipcMain.handle('video:denoise', async (_, filePath, outputPath) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-vf', 'hqdn3d=4:3:6:4.5',
      '-c:a', 'copy',
      outputPath,
      '-y'
    ]

    const ffmpeg = spawn('ffmpeg', args)
    let error = ''

    ffmpeg.stderr.on('data', (data) => { error += data })

    ffmpeg.on('close', (code) => {
      if (code !== 0) return reject(error || 'ffmpeg failed')
      resolve(outputPath)
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
