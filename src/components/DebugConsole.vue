<template>
  <div class="debug-console" v-if="showConsole">
    <div class="console-header">
      <h3>Debug Console</h3>
      <button class="close-btn" @click="toggleConsole">
        <X class="w-4 h-4" />
      </button>
    </div>
    
    <div class="console-controls">
      <button class="control-btn" @click="clearLogs">Clear</button>
      <button class="control-btn" @click="exportLogs">Export</button>
      <label class="control-label">
        <input type="checkbox" v-model="autoScroll" />
        Auto-scroll
      </label>
    </div>
    
    <div class="console-logs" ref="logsContainer">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        class="log-entry"
        :class="log.level"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-level">{{ log.level }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
    
    <div class="console-input">
      <input 
        v-model="commandInput"
        @keyup.enter="executeCommand"
        placeholder="Enter command..."
        class="command-input"
      />
      <button class="execute-btn" @click="executeCommand">Run</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'

interface LogEntry {
  time: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

const showConsole = ref(true)
const logs = ref<LogEntry[]>([])
const commandInput = ref('')
const autoScroll = ref(true)
const logsContainer = ref<HTMLElement | null>(null)

function toggleConsole() {
  showConsole.value = !showConsole.value
}

function addLog(level: 'info' | 'warn' | 'error' | 'debug', message: string) {
  const now = new Date()
  const time = now.toLocaleTimeString()
  
  logs.value.push({
    time,
    level,
    message
  })
  
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
}

function clearLogs() {
  logs.value = []
}

function exportLogs() {
  const logText = logs.value
    .map(log => `[${log.time}] [${log.level.toUpperCase()}] ${log.message}`)
    .join('\n')
  
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-logs-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function executeCommand() {
  const command = commandInput.value.trim()
  if (!command) return
  
  addLog('debug', `> ${command}`)
  
  // Simple command processing
  if (command === 'clear') {
    clearLogs()
  } else if (command === 'help') {
    addLog('info', 'Available commands: clear, help, logs, version')
  } else if (command === 'logs') {
    addLog('info', `Total logs: ${logs.value.length}`)
  } else if (command === 'version') {
    addLog('info', 'Aria Video Editor v0.1.0')
  } else {
    addLog('warn', `Unknown command: ${command}`)
  }
  
  commandInput.value = ''
}

// Expose addLog function globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugConsole = {
    log: (message: string) => addLog('info', message),
    warn: (message: string) => addLog('warn', message),
    error: (message: string) => addLog('error', message),
    debug: (message: string) => addLog('debug', message),
    show: () => (showConsole.value = true),
    hide: () => (showConsole.value = false)
  }
}

// Intercept console errors
const originalError = console.error
console.error = (...args: any[]) => {
  originalError.apply(console, args)
  addLog('error', args.join(' '))
}

const originalWarn = console.warn
console.warn = (...args: any[]) => {
  originalWarn.apply(console, args)
  addLog('warn', args.join(' '))
}

// Add initial log
addLog('info', 'Debug console initialized')
</script>

<style scoped>
.debug-console {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 600px;
  height: 400px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-top-left-radius: 8px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #0d0d0d;
  border-bottom: 1px solid #333;
}

.console-header h3 {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: #333;
  color: white;
}

.console-controls {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #151515;
  border-bottom: 1px solid #333;
}

.control-btn {
  padding: 0.25rem 0.75rem;
  background: #333;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #444;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #888;
  font-size: 0.75rem;
  cursor: pointer;
}

.console-logs {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  background: #0d0d0d;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #1a1a1a;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-level {
  color: #888;
  min-width: 60px;
  font-weight: 600;
}

.log-entry.info .log-level {
  color: #6366f1;
}

.log-entry.warn .log-level {
  color: #f59e0b;
}

.log-entry.error .log-level {
  color: #ef4444;
}

.log-entry.debug .log-level {
  color: #10b981;
}

.log-message {
  color: #ccc;
  flex: 1;
  word-break: break-word;
}

.console-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #151515;
  border-top: 1px solid #333;
}

.command-input {
  flex: 1;
  padding: 0.5rem;
  background: #0d0d0d;
  border: 1px solid #333;
  border-radius: 4px;
  color: white;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.command-input:focus {
  outline: none;
  border-color: #6366f1;
}

.execute-btn {
  padding: 0.5rem 1rem;
  background: #6366f1;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.execute-btn:hover {
  background: #4f46e5;
}
</style>
