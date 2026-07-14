<template>
  <div class="timeline">
    <div class="timeline-content">
      <div class="timeline-ruler-container">
        <TimelineRuler :marks="timeline.timeMarks" @start-drag="timeline.startRulerDrag" />
      </div>
      <div class="tracks-container">
        <TimelineTrack v-for="track in props.tracks" :key="track.id" :track="track" :duration="timeline.effectiveDuration" :selectedIds="timeline.selectedClipIds" :boxSelection="timeline.boxSelection" :selectionBoxStyle="timeline.selectionBoxStyle" :onClipMouseDown="timeline.startClipDrag" :onClipDoubleClick="timeline.startClipDragImmediate" :onClipContextMenu="timeline.showContextMenu" :onLaneMouseDown="timeline.startBoxSelection" @add-clip="emit('addClip', $event)" />
      </div>
      <TimelinePlayhead :position="timeline.playheadPosition" @start-drag="timeline.startDrag" />
    </div>
    <TimelineContextMenu :visible="timeline.contextMenu.visible" :x="timeline.contextMenu.x" :y="timeline.contextMenu.y" @cut="timeline.splitClipAtCursor" @select-all-track="timeline.selectAllClipsInTrack" @info="timeline.showClipInfo" @go-to="timeline.goToFileLocation" @proxy="timeline.createProxy" @close="timeline.hideContextMenu" />
    <TimelineClipInfo :visible="timeline.clipInfoModal.visible" :data="timeline.clipInfoModal.data" @close="timeline.hideClipInfo" />
  </div>
</template>

<script setup lang="ts">
import TimelineRuler from './TimelineRuler.vue'
import TimelineTrack from './TimelineTrack.vue'
import TimelinePlayhead from './TimelinePlayhead.vue'
import TimelineContextMenu from './TimelineContextMenu.vue'
import TimelineClipInfo from './TimelineClipInfo.vue'
import { useTimeline } from '../composables/useTimeline'
import type { TimelineTrack as TTrack, VideoClip } from '../stores/project'
import { reactive } from 'vue'

const props = defineProps<{ tracks: TTrack[]; duration: number; currentTime: number; isPlaying: boolean; selectedClips?: VideoClip[] }>()
const emit = defineEmits<{
  addClip: [trackId: string]
  'select-clips': [clips: VideoClip[]]
  timeUpdate: [time: number]
  cutClip: []
  'move-clip': [clipId: string, newStart: number]
  'split-clip': [clipId: string, splitTime: number]
}>()

const timeline = reactive(useTimeline(props, emit))
</script>

<style scoped>
.timeline { position: relative; background: #1a1a1a; border-top: 1px solid #333; height: 300px; overflow: hidden }
.timeline-content { position: relative; padding: 0 10px; height: 100% }
.timeline-ruler-container { padding: 0 }
.tracks-container { padding: 1rem 0; overflow: hidden }
</style>
