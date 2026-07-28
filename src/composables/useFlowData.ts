import { ref } from 'vue'

interface TextConfig {
  x: number
  y: number
  value: string
}

export interface GraphNode {
  id: string
  type: string
  x: number
  y: number
  text?: string | TextConfig
  properties?: {
    text?: string
    [key: string]: any
  }
}

export interface GraphEdge {
  id: string
  type: string
  sourceNodeId: string
  targetNodeId: string
  text?: string | TextConfig
  properties?: {
    polarity?: 'S' | 'O'
    [key: string]: any
  }
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const getNodeText = (node: GraphNode): string => {
  if (typeof node.text === 'string') {
    return node.text
  }
  if (node.text && typeof node.text === 'object' && 'value' in node.text) {
    return node.text.value
  }
  if (node.properties && node.properties.text) {
    return node.properties.text
  }
  return node.id
}

const getEdgePolarity = (edge: GraphEdge): string => {
  if (edge.properties && edge.properties.polarity) {
    return edge.properties.polarity
  }
  if (typeof edge.text === 'string') {
    if (edge.text === 'S' || edge.text === 'O') {
      return edge.text
    }
  }
  if (edge.text && typeof edge.text === 'object' && 'value' in edge.text) {
    if (edge.text.value === 'S' || edge.text.value === 'O') {
      return edge.text.value
    }
  }
  return '?'
}

export function useFlowData() {
  const graphData = ref<GraphData>({ nodes: [], edges: [] })

  const setGraphData = (data: GraphData) => {
    graphData.value = data
  }

  const convertToCausalText = (data: GraphData): string => {
    if (data.edges.length === 0) {
      if (data.nodes.length === 0) {
        return '[当前因果回路图结构]\n（暂无节点和连线）'
      }
      const nodeNames = data.nodes.map(node => `- ${getNodeText(node)}`).join('\n')
      return `[当前因果回路图结构]\n（暂无连线）\n节点列表:\n${nodeNames}`
    }

    const nodeMap = new Map<string, string>()
    data.nodes.forEach(node => {
      nodeMap.set(node.id, getNodeText(node))
    })

    const lines = data.edges.map(edge => {
      const source = nodeMap.get(edge.sourceNodeId) || edge.sourceNodeId
      const target = nodeMap.get(edge.targetNodeId) || edge.targetNodeId
      const polarity = getEdgePolarity(edge)
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
