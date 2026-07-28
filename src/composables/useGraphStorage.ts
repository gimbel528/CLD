import { ref } from 'vue'
import type { GraphData } from './useFlowData'

export interface SavedGraph {
  id: string
  name: string
  data: GraphData
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'cld-saved-graphs'

const savedGraphs = ref<SavedGraph[]>([])
let initialized = false

const loadSavedGraphs = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      savedGraphs.value = JSON.parse(stored)
    } else {
      savedGraphs.value = []
    }
    initialized = true
  } catch (e) {
    console.error('加载保存的图表失败:', e)
    savedGraphs.value = []
  }
}

const saveGraphs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGraphs.value))
  } catch (e) {
    console.error('保存图表失败:', e)
  }
}

export function useGraphStorage() {
  if (!initialized) {
    loadSavedGraphs()
  }

  const refreshFromStorage = () => {
    loadSavedGraphs()
  }

  const saveCurrentGraph = (name: string, data: GraphData): SavedGraph => {
    const now = Date.now()
    const newGraph: SavedGraph = {
      id: `graph_${now}`,
      name: name || '未命名图表',
      data,
      createdAt: now,
      updatedAt: now,
    }
    savedGraphs.value.unshift(newGraph)
    saveGraphs()
    return newGraph
  }

  const updateGraph = (id: string, data: GraphData) => {
    const index = savedGraphs.value.findIndex(g => g.id === id)
    if (index !== -1) {
      savedGraphs.value[index].data = data
      savedGraphs.value[index].updatedAt = Date.now()
      saveGraphs()
    }
  }

  const renameGraph = (id: string, newName: string) => {
    const index = savedGraphs.value.findIndex(g => g.id === id)
    if (index !== -1) {
      savedGraphs.value[index].name = newName
      savedGraphs.value[index].updatedAt = Date.now()
      saveGraphs()
    }
  }

  const deleteGraph = (id: string) => {
    savedGraphs.value = savedGraphs.value.filter(g => g.id !== id)
    saveGraphs()
  }

  const getGraph = (id: string): SavedGraph | undefined => {
    return savedGraphs.value.find(g => g.id === id)
  }

  return {
    savedGraphs,
    refreshFromStorage,
    saveCurrentGraph,
    updateGraph,
    renameGraph,
    deleteGraph,
    getGraph,
  }
}

