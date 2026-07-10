import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const bindings = require('bindings')('video_engine')

export const getMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const meta = bindings.getMetadata(filePath)
      resolve(meta)
    } catch (error) {
      reject(error)
    }
  })
}

export const generateProxy = (inputPath, outputPath, settings) => {
  return new Promise((resolve, reject) => {
    bindings.generateProxy(inputPath, outputPath, settings, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}

export const renderFrame = (filePath, timestamp, width, height) => {
  return new Promise((resolve, reject) => {
    try {
      const buffer = bindings.renderFrame(filePath, timestamp, width, height)
      resolve(buffer)
    } catch (error) {
      reject(error)
    }
  })
}

export const convertVideo = (inputPath, outputPath, settings) => {
  return new Promise((resolve, reject) => {
    bindings.convertVideo(inputPath, outputPath, settings, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}
