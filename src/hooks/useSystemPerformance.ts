import { ref, onMounted } from 'vue'
import type { SystemPerformance, GPUSupport } from '../types/electron'

export function useSystemPerformance() {
  const systemPerformance = ref<SystemPerformance | null>(null)
  const gpuSupport = ref<GPUSupport | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const detectPerformance = async () => {
    if (!window.electronAPI) return
    
    try {
      isLoading.value = true
      error.value = null
      
      const [perf, gpu] = await Promise.all([
        window.electronAPI.getSystemPerformance(),
        window.electronAPI.checkFFmpegGPUSupport()
      ])
      
      systemPerformance.value = perf
      gpuSupport.value = gpu
    } catch (e) {
      error.value = e as string
      console.error('Failed to detect system performance:', e)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    detectPerformance()
  })

  return {
    systemPerformance,
    gpuSupport,
    isLoading,
    error,
    detectPerformance
  }
}
