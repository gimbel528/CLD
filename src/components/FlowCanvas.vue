<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose, nextTick, watch } from 'vue'
import LogicFlow from '@logicflow/core'
import { RectNode, RectNodeModel } from '@logicflow/core'
import { BezierEdge, BezierEdgeModel } from '@logicflow/core'
import '@logicflow/core/dist/index.css'
import type { GraphData } from '@/composables/useFlowData'

const emit = defineEmits<{
  (e: 'data-change', data: GraphData): void
  (e: 'edge-selected', edgeId: string | null): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let lf: LogicFlow | null = null
const selectedEdgeId = ref<string | null>(null)
const edgePopupPosition = ref({ x: 0, y: 0 })
const showEdgePopup = ref(false)

const POLARITY_SAME = 'S'
const POLARITY_OPPOSITE = 'O'

class CLDNodeModel extends RectNodeModel {
  setAttributes() {
    this.width = 120
    this.height = 50
    this.text.draggable = false
    this.text.editable = true
  }

  initNodeData(data: any) {
    super.initNodeData(data)
    if (!data.properties?.text) {
      this.text.value = '新节点'
    }
    this.resizeNodeByText()
  }

  setText(val: string) {
    super.setText(val)
    this.resizeNodeByText()
  }

  updateText(val: string) {
    super.updateText(val)
    this.resizeNodeByText()
  }

  resizeNodeByText() {
    const text = this.text.value || ''
    const fontSize = 14
    const padding = 32
    const minWidth = 120
    const maxWidth = 400
    const chineseCharWidth = fontSize * 1.1
    const englishCharWidth = fontSize * 0.6
    let totalWidth = 0
    for (let i = 0; i < text.length; i++) {
      if (/[\u4e00-\u9fa5]/.test(text[i])) {
        totalWidth += chineseCharWidth
      } else {
        totalWidth += englishCharWidth
      }
    }
    const estimatedWidth = totalWidth + padding
    const newWidth = Math.min(Math.max(estimatedWidth, minWidth), maxWidth)
    this.width = newWidth
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    style.fill = '#1e3a5f'
    style.stroke = '#3b82f6'
    style.strokeWidth = 2
    style.radius = 8
    return style
  }

  getTextStyle() {
    const style = super.getTextStyle()
    style.color = '#ffffff'
    style.fontSize = 14
    style.fontWeight = 500
    style.fontFamily = 'Inter, sans-serif'
    return style
  }
}

class CLDEdgeModel extends BezierEdgeModel {
  setAttributes() {
    this.offset = 30
  }

  getEdgeStyle() {
    const style = super.getEdgeStyle()
    const properties = this.getProperties()
    if (properties.polarity === 'S') {
      style.stroke = '#10b981'
      style.strokeDasharray = 'none'
    } else if (properties.polarity === 'O') {
      style.stroke = '#ef4444'
      style.strokeDasharray = 'none'
    } else {
      style.stroke = '#64748b'
      style.strokeDasharray = '6 6'
    }
    style.strokeWidth = 2.5
    return style
  }

  getArrowStyle() {
    const style = super.getArrowStyle()
    const properties = this.getProperties()
    if (properties.polarity === 'S') {
      style.fill = '#10b981'
      style.stroke = '#10b981'
    } else if (properties.polarity === 'O') {
      style.fill = '#ef4444'
      style.stroke = '#ef4444'
    } else {
      style.fill = '#64748b'
      style.stroke = '#64748b'
    }
    return style
  }

  getTextStyle() {
    const style = super.getTextStyle()
    const properties = this.getProperties()
    const isPositive = properties.polarity === 'S'
    style.color = isPositive ? '#10b981' : '#ef4444'
    style.fontSize = 16
    style.fontWeight = 'bold'
    style.background = {
      fill: '#0f172a',
      stroke: isPositive ? '#10b981' : '#ef4444',
      padding: [6, 10],
      radius: 12,
    }
    return style
  }

  getTextPosition() {
    const self = this as any
    const pointsList = self.pointsList as { x: number; y: number }[]
    if (pointsList && pointsList.length === 4) {
      const start = pointsList[0]
      const cp1 = pointsList[1]
      const cp2 = pointsList[2]
      const end = pointsList[3]

      const t = 0.78
      const x = Math.pow(1 - t, 3) * start.x +
                3 * Math.pow(1 - t, 2) * t * cp1.x +
                3 * (1 - t) * Math.pow(t, 2) * cp2.x +
                Math.pow(t, 3) * end.x
      const y = Math.pow(1 - t, 3) * start.y +
                3 * Math.pow(1 - t, 2) * t * cp1.y +
                3 * (1 - t) * Math.pow(t, 2) * cp2.y +
                Math.pow(t, 3) * end.y

      return { x, y, value: self.text.value }
    }
    return super.getTextPosition()
  }
}

const updateEdgePopupPosition = (edgeId: string) => {
  if (!lf || !containerRef.value) return
  const edgeModel = lf.getEdgeModelById(edgeId) as any
  if (!edgeModel) return

  const textPosition = edgeModel.getTextPosition()
  const canvasRect = containerRef.value.getBoundingClientRect()

  const canvasData = lf.getTransform() as any
  const zoom = canvasData.SCALE_X || 1
  const translateX = canvasData.TRANSLATE_X || 0
  const translateY = canvasData.TRANSLATE_Y || 0

  edgePopupPosition.value = {
    x: textPosition.x * zoom + translateX + canvasRect.left,
    y: textPosition.y * zoom + translateY + canvasRect.top - 60,
  }
}

const initLogicFlow = () => {
  if (!containerRef.value) return

  lf = new LogicFlow({
    container: containerRef.value,
    grid: {
      visible: true,
      type: 'dot',
      size: 20,
      config: {
        color: '#334155',
        thickness: 1.5,
      },
    },
    background: {
      color: '#0f172a',
    },
    keyboard: {
      enabled: true,
      shortcuts: [],
    },
    edgeType: 'cld-edge',
    style: {
      rect: {
        rx: 8,
        ry: 8,
      },
      nodeText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 500,
      },
      edgeText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        textWidth: 40,
      },
    },
  })

  lf.register({
    type: 'cld-node',
    view: RectNode,
    model: CLDNodeModel,
  })

  lf.register({
    type: 'cld-edge',
    view: BezierEdge,
    model: CLDEdgeModel,
  })

  lf.render({
    nodes: [],
    edges: [],
  })

  lf.on('text:update', ({ data }: any) => {
    if (data.type === 'node') {
      const nodeModel = lf?.getNodeModelById(data.id) as any
      if (nodeModel && nodeModel.resizeNodeByText) {
        nodeModel.resizeNodeByText()
      }
    }
  })

  lf.on('node:add,node:drop,node:dragend,edge:add,edge:adjust,text:update,element:remove', () => {
    nextTick(() => {
      const data = lf?.getGraphData()
      if (data) {
        emit('data-change', data as GraphData)
      }
    })
  })

  lf.on('edge:click', ({ data }: any) => {
    selectedEdgeId.value = data.id
    showEdgePopup.value = true
    emit('edge-selected', data.id)
    nextTick(() => {
      updateEdgePopupPosition(data.id)
    })
  })

  lf.on('blank:click', () => {
    selectedEdgeId.value = null
    showEdgePopup.value = false
    emit('edge-selected', null)
  })

  lf.on('node:click', () => {
    selectedEdgeId.value = null
    showEdgePopup.value = false
    emit('edge-selected', null)
  })

  lf.on('edge:add', ({ data }: any) => {
    selectedEdgeId.value = data.id
    showEdgePopup.value = true
    emit('edge-selected', data.id)
    nextTick(() => {
      updateEdgePopupPosition(data.id)
    })
  })

  lf.on('node:dragend,canvas:zoom,canvas:scroll,edge:adjust', () => {
    if (selectedEdgeId.value && showEdgePopup.value) {
      nextTick(() => {
        updateEdgePopupPosition(selectedEdgeId.value!)
      })
    }
  })
}

const addNode = () => {
  if (!lf) return
  const nodeId = `node_${Date.now()}`
  lf.addNode({
    id: nodeId,
    type: 'cld-node',
    x: 200 + Math.random() * 200,
    y: 200 + Math.random() * 200,
    properties: {
      text: '新节点',
    },
  })
}

const deleteSelected = () => {
  if (!lf) return
  const elements = lf.getSelectElements()
  if (elements.nodes.length > 0 || elements.edges.length > 0) {
    elements.nodes.forEach((node: any) => lf?.deleteNode(node.id))
    elements.edges.forEach((edge: any) => lf?.deleteEdge(edge.id))
    selectedEdgeId.value = null
    showEdgePopup.value = false
    emit('edge-selected', null)
  }
}

const clearCanvas = () => {
  if (!lf) return
  if (confirm('确定要清空画布吗？')) {
    lf.clearData()
    selectedEdgeId.value = null
    showEdgePopup.value = false
    emit('edge-selected', null)
  }
}

const setEdgePolarity = (edgeId: string, polarity: 'S' | 'O') => {
  if (!lf) return
  const edgeModel = lf.getEdgeModelById(edgeId) as any
  if (edgeModel) {
    lf.setProperties(edgeId, { polarity })
    if (edgeModel.text) {
      edgeModel.text.value = polarity
    }
    showEdgePopup.value = false
    nextTick(() => {
      const data = lf?.getGraphData()
      if (data) {
        emit('data-change', data as GraphData)
      }
    })
  }
}

const handleSetPolarity = (polarity: 'S' | 'O') => {
  if (selectedEdgeId.value) {
    setEdgePolarity(selectedEdgeId.value, polarity)
  }
}

const getGraphData = (): GraphData => {
  if (!lf) return { nodes: [], edges: [] }
  return lf.getGraphData() as GraphData
}

const getSelectedEdgeId = (): string | null => {
  return selectedEdgeId.value
}

defineExpose({
  addNode,
  deleteSelected,
  clearCanvas,
  setEdgePolarity,
  getGraphData,
  getSelectedEdgeId,
})

watch(selectedEdgeId, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updateEdgePopupPosition(newVal)
    })
  }
})

onMounted(() => {
  initLogicFlow()
})

onBeforeUnmount(() => {
  lf = null
})
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="containerRef" class="w-full h-full"></div>

    <Teleport to="body">
      <div
        v-if="showEdgePopup && selectedEdgeId"
        class="fixed z-50 flex items-center gap-2 px-3 py-2 bg-cld-surface/95 backdrop-blur-sm border border-cld-border rounded-xl shadow-xl animate-fade-in"
        :style="{
          left: edgePopupPosition.x + 'px',
          top: edgePopupPosition.y + 'px',
          transform: 'translateX(-50%)',
        }"
        @click.stop
      >
        <span class="text-cld-text-muted text-xs mr-1">极性：</span>
        <button
          @click="handleSetPolarity('S')"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-cld-positive/20 text-cld-positive border border-cld-positive/40 hover:bg-cld-positive/30 hover:border-cld-positive/60 transition-all"
        >
          <span class="text-base leading-none font-black">S</span>
          <span>同向</span>
        </button>
        <button
          @click="handleSetPolarity('O')"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-cld-negative/20 text-cld-negative border border-cld-negative/40 hover:bg-cld-negative/30 hover:border-cld-negative/60 transition-all"
        >
          <span class="text-base leading-none font-black">O</span>
          <span>反向</span>
        </button>
        <div class="w-px h-6 bg-cld-border mx-1"></div>
        <button
          @click="showEdgePopup = false"
          class="p-1.5 rounded-md text-cld-text-muted hover:text-cld-text hover:bg-cld-border/50 transition-colors"
          title="关闭"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style>
.lf-text-input {
  color: #ffffff !important;
  fill: #ffffff !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  background: #1e293b !important;
  background-color: #1e293b !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 8px !important;
  padding: 10px 16px !important;
  text-align: center !important;
  outline: none !important;
  min-width: 120px !important;
  width: auto !important;
  max-width: 350px !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  z-index: 1000 !important;
  font-family: 'Inter', sans-serif !important;
}

.lf-text-input::placeholder {
  color: #64748b !important;
}

.lf-text-input:focus {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.lf-text-edit-content {
  color: #ffffff !important;
  fill: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.lf-element-text {
  fill: #ffffff !important;
  color: #ffffff !important;
}

.lf-text {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.lf-node-text {
  fill: #ffffff !important;
  color: #ffffff !important;
}

.lf-edge-text {
  fill: #ffffff !important;
  color: #ffffff !important;
}
</style>
