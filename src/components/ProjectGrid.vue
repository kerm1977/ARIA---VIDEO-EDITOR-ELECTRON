<template>
  <div class="project-grid">
    <div class="grid-header">
      <h2 class="text-2xl font-bold">Drafts</h2>
      <button @click="createNewProject" class="new-project-btn"><Plus class="w-5 h-5" />New Project</button>
    </div>
    <div class="projects-container">
      <div v-for="project in projects" :key="project.id" class="project-card" @click="openProject(project)">
        <div class="project-thumbnail"><Video class="w-12 h-12 text-gray-600" /></div>
        <div class="project-info">
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-meta">{{ formatDate(project.modified_at) }}</p>
          <p class="project-duration">{{ formatTime(project.duration) }}</p>
        </div>
      </div>
      <div class="project-card new-card" @click="createNewProject">
        <div class="project-thumbnail gradient-bg"><Plus class="w-12 h-12 text-white" /></div>
        <div class="project-info">
          <h3 class="project-name">New Project</h3>
          <p class="project-meta">Create a new video project</p>
        </div>
      </div>
    </div>
    <div v-if="showNewProjectModal" class="modal-overlay" @click="cancelNewProject">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">New Project</h3>
        <input v-model="newProjectName" class="modal-input" placeholder="Project name" @keyup.enter="confirmNewProject" />
        <div class="modal-buttons">
          <button @click="cancelNewProject" class="modal-btn cancel">Cancel</button>
          <button @click="confirmNewProject" class="modal-btn confirm">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Video } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { storeToRefs } from 'pinia'
import { formatTime, formatDate } from '../utils/video'

const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)
const showNewProjectModal = ref(false)
const newProjectName = ref('Untitled Project')

function createNewProject() {
  showNewProjectModal.value = true
}

function confirmNewProject() {
  if (newProjectName.value.trim()) {
    projectStore.createProject(newProjectName.value.trim())
    showNewProjectModal.value = false
    newProjectName.value = 'Untitled Project'
  }
}

function cancelNewProject() {
  showNewProjectModal.value = false
  newProjectName.value = 'Untitled Project'
}

function openProject(project: any) { projectStore.setCurrentProject(project) }
</script>

<style scoped>
.project-grid { padding: 2rem }
.grid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem }
.new-project-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border: none; border-radius: 0.5rem; color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s }
.new-project-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) }
.projects-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem }
.project-card { background: #1a1a1a; border: 1px solid #333; border-radius: 0.75rem; padding: 1.5rem; cursor: pointer; transition: all 0.2s }
.project-card:hover { border-color: #6366f1; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) }
.project-card.new-card { border: 2px dashed #444; background: transparent }
.project-card.new-card:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.1) }
.project-thumbnail { width: 100%; height: 160px; background: #0d0d0d; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem }
.gradient-bg { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) }
.project-info { text-align: left }
.project-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem; color: white }
.project-meta { font-size: 0.875rem; color: #888; margin-bottom: 0.25rem }
.project-duration { font-size: 0.875rem; color: #666 }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000 }
.modal-content { background: #1a1a1a; border: 1px solid #333; border-radius: 0.75rem; padding: 2rem; min-width: 400px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) }
.modal-title { font-size: 1.25rem; font-weight: 600; color: white; margin-bottom: 1.5rem }
.modal-input { width: 100%; padding: 0.75rem; background: #0d0d0d; border: 1px solid #333; border-radius: 0.5rem; color: white; font-size: 1rem; margin-bottom: 1.5rem; outline: none }
.modal-input:focus { border-color: #6366f1 }
.modal-buttons { display: flex; gap: 1rem; justify-content: flex-end }
.modal-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s }
.modal-btn.cancel { background: #333; color: white }
.modal-btn.cancel:hover { background: #444 }
.modal-btn.confirm { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white }
.modal-btn.confirm:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) }
</style>
