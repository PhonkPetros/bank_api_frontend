import { ref } from 'vue'

const listeners = ref({})

export function useEventBus() {
  const emit = (event, data) => {
    if (listeners.value[event]) {
      listeners.value[event].forEach(callback => callback(data))
    }
  }

  const on = (event, callback) => {
    if (!listeners.value[event]) {
      listeners.value[event] = []
    }
    listeners.value[event].push(callback)
  }

  const off = (event) => {
    if (listeners.value[event]) {
      listeners.value[event] = []
    }
  }

  return {
    emit,
    on,
    off
  }
} 