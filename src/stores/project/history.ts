import type { ProjectState } from './types'

const MAX_HISTORY = 50

export function pushHistory(state: ProjectState) {
  const snapshot = {
    currentProject: state.currentProject.value,
    projects: state.projects.value,
    proxySettings: state.proxySettings.value
  }
  const cloned = JSON.parse(JSON.stringify(snapshot))
  if (state.historyIndex.value < state.history.value.length - 1) {
    state.history.value.splice(state.historyIndex.value + 1)
  }
  state.history.value.push(cloned)
  if (state.history.value.length > MAX_HISTORY) state.history.value.shift()
  state.historyIndex.value = state.history.value.length - 1
}

function restoreHistory(state: ProjectState) {
  const snapshot = state.history.value[state.historyIndex.value]
  if (snapshot) {
    state.currentProject.value = JSON.parse(JSON.stringify(snapshot.currentProject))
    state.projects.value = JSON.parse(JSON.stringify(snapshot.projects))
    state.proxySettings.value = JSON.parse(JSON.stringify(snapshot.proxySettings))
  }
}

export function undo(state: ProjectState) {
  if (state.historyIndex.value > 0) {
    state.historyIndex.value--
    restoreHistory(state)
  }
}

export function redo(state: ProjectState) {
  if (state.historyIndex.value < state.history.value.length - 1) {
    state.historyIndex.value++
    restoreHistory(state)
  }
}
