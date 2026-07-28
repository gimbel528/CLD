export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  stream: boolean
}

const SYSTEM_PROMPT = `你是一个顶级的系统动力学和系统思考专家。用户将提供一张因果回路图（CLD）的文本结构数据和问题。
请基于图中要素的因果关系（'S'表示同向变化，'O'表示反向变化）进行深度分析。
你的回答需包含：
1. 识别出的回路类型（增强回路 R 或 调节回路 B）。
2. 针对用户问题的深度解答。
3. 建议新增的缺失要素及连线建议（以文本描述形式）。
4. 系统破局点（杠杆点）建议。`

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal
) {
  try {
    const allMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: allMessages,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      let errorMsg = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMsg = errorData.error
        }
      } catch {
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMsg = errorText
          }
        } catch {
          // ignore
        }
      }
      throw new Error(errorMsg)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let chunkCount = 0
    const MAX_CHUNKS = 10000

    while (chunkCount < MAX_CHUNKS) {
      const { done, value } = await reader.read()
      if (done) break

      chunkCount++
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    onDone()
  } catch (error: any) {
    if (error.name === 'AbortError') {
      onDone()
      return
    }
    onError(error.message || '未知错误')
  }
}
