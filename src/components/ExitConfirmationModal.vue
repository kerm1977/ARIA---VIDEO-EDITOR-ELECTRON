<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-content">
      <h2 class="modal-title">¿Estás seguro de salir?</h2>
      <p class="modal-message">Todos los cambios se guardarán antes de volver a la vista de proyectos.</p>
      <div class="modal-actions">
        <button class="modal-btn cancel" @click="emit('cancel')">Cancelar</button>
        <button class="modal-btn confirm" @click="emit('confirm')">Salir y guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 2rem;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-title {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.modal-message {
  color: #ccc;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-btn.cancel {
  background: #333;
  color: white;
}

.modal-btn.cancel:hover {
  background: #444;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.modal-btn.confirm:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}
</style>
