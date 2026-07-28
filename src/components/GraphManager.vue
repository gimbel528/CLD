<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGraphStorage } from '@/composables/useGraphStorage'
import type { GraphData } from '@/composables/useFlowData'
import type { SavedGraph } from '@/composables/useGraphStorage'

interface Props {
  visible: boolean
  currentGraphData: GraphData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'load', graph: SavedGraph): void
  (e: 'saved'): void
}>()

const { savedGraphs, saveCurrentGraph, deleteGraph, renameGraph } = useGraphStorage()

const activeTab = ref<'list' | 'save'>('list')
const saveName = ref('')
const renameId = ref<string | null>(null)
const renameText = ref('')

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleSave = () => {
  if (!saveName.value.trim()) {
    alert('请输入图表名称')
    return
  }
  saveCurrentGraph(saveName.value.trim(), props.currentGraphData)
  saveName.value = ''
  activeTab.value = 'list'
  emit('saved')
}

const handleLoad = (graph: SavedGraph) => {
  emit('load', graph)
  emit('close')
}

const handleDelete = (graph: SavedGraph) => {
  if (confirm(`确定要删除「${graph.name}」吗？`)) {
    deleteGraph(graph.id)
  }
}

const startRename = (graph: SavedGraph) => {
  renameId.value = graph.id
  renameText.value = graph.name
}

const confirmRename = () => {
  if (renameId.value && renameText.value.trim()) {
    renameGraph(renameId.value, renameText.value.trim())
  }
  renameId.value = null
  renameText.value = ''
}

const cancelRename = () => {
  renameId.value = null
  renameText.value = ''
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-[500px] max-h-[80vh] bg-cld-surface rounded-xl border border-cld-border shadow-2xl overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-cld-border">
          <div class="flex items-center gap-1 bg-cld-bg rounded-lg p-1">
            <button
              @click="activeTab = 'list'"
              :class="[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'list'
                  ? 'bg-cld-accent text-white shadow'
                  : 'text-cld-text-muted hover:text-cld-text'
              ]"
            >
              我的图表
            </button>
            <button
              @click="activeTab = 'save'"
              :class="[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                activeTab === 'save'
                  ? 'bg-cld-accent text-white shadow'
                  : 'text-cld-text-muted hover:text-cld-text'
              ]"
            >
              保存当前
            </button>
          </div>
          <button
            @click="emit('close')"
            class="p-1.5 rounded-md text-cld-text-muted hover:text-cld-text hover:bg-cld-border/50 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="activeTab === 'list'">
            <div v-if="savedGraphs.length === 0" class="flex flex-col items-center justify-center py-12 text-cld-text-muted">
              <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-sm">暂无保存的图表</p>
              <p class="text-xs mt-1">点击「保存当前」标签保存当前画布</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="graph in savedGraphs"
                :key="graph.id"
                class="group flex items-center justify-between p-3 rounded-lg border border-cld-border hover:border-cld-accent/50 hover:bg-cld-accent/5 transition-all"
              >
                <div class="flex-1 min-w-0">
                  <div v-if="renameId === graph.id" class="flex items-center gap-2">
                    <input
                      v-model="renameText"
                      @keyup.enter="confirmRename"
                      @keyup.esc="cancelRename"
                      class="flex-1 px-2 py-1 bg-cld-bg border border-cld-accent rounded text-cld-text text-sm outline-none"
                      autofocus
                    />
                    <button
                      @click="confirmRename"
                      class="px-2 py-1 text-xs text-cld-positive hover:bg-cld-positive/20 rounded transition-colors"
                    >
                      确定
                    </button>
                    <button
                      @click="cancelRename"
                      class="px-2 py-1 text-xs text-cld-text-muted hover:bg-cld-border/50 rounded transition-colors"
                    >
                      取消
                    </button>
                  </div>
                  <div v-else>
                    <div class="text-cld-text font-medium truncate">{{ graph.name }}</div>
                    <div class="text-cld-text-muted text-xs mt-0.5">
                      {{ graph.data.nodes?.length || 0 }} 个节点 · {{ graph.data.edges?.length || 0 }} 条连线 · {{ formatDate(graph.updatedAt) }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="handleLoad(graph)"
                    class="px-3 py-1.5 rounded-md text-sm text-cld-accent hover:bg-cld-accent/20 transition-colors"
                    title="加载此图表"
                  >
                    打开
                  </button>
                  <button
                    @click="startRename(graph)"
                    class="p-1.5 rounded-md text-cld-text-muted hover:text-cld-text hover:bg-cld-border/50 transition-colors"
                    title="重命名"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(graph)"
                    class="p-1.5 rounded-md text-cld-text-muted hover:text-red-400 hover:bg-red-500/20 transition-colors"
                    title="删除"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div>
              <label class="block text-cld-text text-sm mb-2">图表名称</label>
              <input
                v-model="saveName"
                @keyup.enter="handleSave"
                type="text"
                placeholder="请输入图表名称..."
                class="w-full px-4 py-2.5 bg-cld-bg border border-cld-border rounded-lg text-cld-text placeholder-cld-text-muted/50 focus:outline-none focus:border-cld-accent/50 focus:ring-1 focus:ring-cld-accent/30 transition-all"
              />
            </div>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                @click="activeTab = 'list'"
                class="px-4 py-2 rounded-lg text-sm text-cld-text-muted hover:text-cld-text hover:bg-cld-border/50 transition-colors"
              >
                取消
              </button>
              <button
                @click="handleSave"
                class="px-4 py-2 rounded-lg text-sm text-white bg-cld-accent hover:bg-cld-accent/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
