<template>
  <div class="video-preview">
    <PreviewPlayer ref="playerRef" :current-clip="props.currentClip" :selected-clip="props.selectedClip" :current-time="props.currentTime" :aspect-ratio="props.aspectRatio" :active-tool="props.activeTool" :volume="volume" :is-playing="props.isPlaying" @playStateChange="emit('playStateChange', $event)" @rotate="emit('rotate', $event)" @rotateCommit="emit('rotateCommit', $event)" @scale="emit('scale', $event)" @scaleCommit="emit('scaleCommit', $event)" @position="(x, y) => emit('position', x, y)" @positionCommit="(x, y) => emit('positionCommit', x, y)" />
    <PreviewControls :current-clip="props.currentClip" :current-time="props.currentTime" :duration="clipDuration" :is-playing="props.isPlaying" :volume="volume" @togglePlay="playerRef?.togglePlay()" @skipForward="playerRef?.skipForward()" @skipBackward="playerRef?.skipBackward()" @volumeChange="volume = $event" @seek="onSeek" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PreviewPlayer from './PreviewPlayer.vue'
import PreviewControls from './PreviewControls.vue'
import type { VideoClip } from '../stores/project'

const props = defineProps<{
  currentClip: VideoClip | null
  selectedClip?: VideoClip | null
  currentTime?: number
  aspectRatio?: string
  activeTool?: 'rotate' | 'scale' | 'move' | null
  isPlaying?: boolean
}>()

const emit = defineEmits<{
  timeUpdate: [time: number]
  playStateChange: [isPlaying: boolean]
  rotate: [angle: number]
  rotateCommit: [angle: number]
  scale: [scale: number]
  scaleCommit: [scale: number]
  position: [x: number, y: number]
  positionCommit: [x: number, y: number]
  zoomTimeline: [delta: number]
}>()

const playerRef = ref<InstanceType<typeof PreviewPlayer> | null>(null)
const volume = ref(1)

const clipDuration = computed(() => props.currentClip ? props.currentClip.metadata.duration : 0)

function onWheel(e: WheelEvent) {
  console.log('Wheel event:', e.shiftKey, e.deltaY)
  if (e.shiftKey) {
    e.preventDefault()
    const delta = -e.deltaY
    console.log('Emitting zoomTimeline:', delta)
    emit('zoomTimeline', delta)
  }
}

function onSeek(time: number) {
  playerRef.value?.seekTo(time)
  emit('timeUpdate', time)
}

function togglePlay() { playerRef.value?.togglePlay() }
function seekTo(time: number) { playerRef.value?.seekTo(time) }

onMounted(() => {
  window.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('wheel', onWheel)
})

defineExpose({ togglePlay, seekTo })
</script>

<style scoped>
.video-preview { display: flex; flex-direction: column; background: #0d0d0d; border-right: 1px solid #333; overflow: hidden; height: 100% }
</style>
