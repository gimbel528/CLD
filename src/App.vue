<script setup lang="ts">
import { ref, computed } from 'vue'
import FlowCanvas from '@/components/FlowCanvas.vue'
import Toolbar from '@/components/Toolbar.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import { useFlowData } from '@/composables/useFlowData'
import type { GraphData } from '@/composables/useFlowData'

const flowCanvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null)
const selectedEdgeId = ref<string | null>(null)
const { graphData, setGraphData, convertToCausalText } = useFlowData()

const causalText = computed(() => convertToCausalText(graphData.value))

const handleDataChange = (data: GraphData) => {
  setGraphData(data)
}

const handleEdgeSelected = (edgeId: string | null) => {
  selectedEdgeId.value = edgeId
}

const handleAddNode = () => {
  flowCanvasRef.value?.addNode()
}

const handleDelete = () => {
  flowCanvasRef.value?.deleteSelected()
}

const handleClear = () => {
  flowCanvasRef.value?.clearCanvas()
}

const handleExport = () => {
  const data = flowCanvasRef.value?.getGraphData()
  if (data) {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cld-graph-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const handleSetPolarity = (polarity: 'S' | 'O') => {
  if (selectedEdgeId.value) {
    flowCanvasRef.value?.setEdgePolarity(selectedEdgeId.value, polarity)
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col bg-cld-bg">
    <Toolbar
      :selected-edge-id="selectedEdgeId"
      @add-node="handleAddNode"
      @delete="handleDelete"
      @clear="handleClear"
      @export="handleExport"
      @set-polarity="handleSetPolarity"
    />

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 relative">
        <FlowCanvas
          ref="flowCanvasRef"
          @data-change="handleDataChange"
          @edge-selected="handleEdgeSelected"
        />

        <div class="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-cld-surface/90 backdrop-blur-sm border border-cld-border text-xs text-cld-text-muted space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-8 h-px bg-cld-positive inline-block"></span>
            <span>S 同向变化</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-px bg-cld-negative inline-block"></span>
            <span>O 反向变化</span>
          </div>
          <div class="pt-1 border-t border-cld-border mt-1">
            <span>节点数: {{ graphData.nodes.length }}</span>
            <span class="mx-2">|</span>
            <span>连线数: {{ graphData.edges.length }}</span>
          </div>
        </div>
      </div>

      <div class="w-[380px] flex-shrink-0">
        <ChatPanel :causal-text="causalText" />
      </div>
    </div>
  </div>
</template>
