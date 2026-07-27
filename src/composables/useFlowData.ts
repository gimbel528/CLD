import { ref } from 'vue'

export interface GraphNode {
  id: string
  type: string
  x: number
  y: number
  properties: {
    text: string
    [key: string]: any
  }
}

export interface GraphEdge {
  id: string
  type: string
  sourceNodeId: string
  targetNodeId: string
  properties: {
    polarity?: 'S' | 'O'
    [key: string]: any
  }
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function useFlowData() {
  const graphData = ref<GraphData>({ nodes: [], edges: [] })

  const setGraphData = (data: GraphData) => {
    graphData.value = data
  }

  const convertToCausalText = (data: GraphData): string => {
    if (data.edges.length === 0) {
      return '[当前因果回路图结构]\n（暂无节点和连线）'
    }

    const nodeMap = new Map<string, string>()
    data.nodes.forEach(node => {
      nodeMap.set(node.id, node.properties.text || node.id)
    })

    const lines = data.edges.map(edge => {
      const source = nodeMap.get(edge.sourceNodeId) || edge.sourceNodeId
      const target = nodeMap.get(edge.targetNodeId) || edge.targetNodeId
      const polarity = edge.properties.polarity || '?'
      return `- ${source} --(${polarity})--> ${target}`
    })

    return `[当前因果回路图结构]\n${lines.join('\n')}`
  }

  const getCausalText = (): string => {
    return convertToCausalText(graphData.value)
  }

  return {
    graphData,
    setGraphData,
    convertToCausalText,
    getCausalText
  }
}
