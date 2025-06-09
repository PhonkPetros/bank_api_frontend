import { ref } from 'vue'

// Create a single global event bus instance
const globalListeners = ref({})

// Create a single global event bus
const globalEventBus = {
  emit(event, data) {
    if (globalListeners.value[event]) {
      globalListeners.value[event].forEach(callback => callback(data))
    }
  },

  on(event, callback) {
    if (!globalListeners.value[event]) {
      globalListeners.value[event] = []
    }
    globalListeners.value[event].push(callback)
  },

  off(event) {
    if (globalListeners.value[event]) {
      globalListeners.value[event] = []
    }
  }
}

// Export a function that returns the global event bus
export function useEventBus() {
  return globalEventBus
} 