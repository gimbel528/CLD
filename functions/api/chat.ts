interface ChatMessage {
  role: string
  content: string
}

interface ChatRequest {
  model: string
  messages: ChatMessage[]
  stream: boolean
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  ...CORS_HEADERS,
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function onRequestPost(context: {
  request: Request
  env: {
    SILICONFLOW_API_KEY: string
  }
}) {
  try {
    let body: ChatRequest
    try {
      body = await context.request.json() as ChatRequest
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: `请求体解析失败: ${e.message}` }),
        { status: 400, headers: JSON_HEADERS }
      )
    }

    const apiKey = context.env.SILICONFLOW_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key 未配置：环境变量 SILICONFLOW_API_KEY 为空，请在 Cloudflare Pages 设置中添加 Secret' }),
        { status: 500, headers: JSON_HEADERS }
      )
    }

    if (apiKey === 'your-api-key-here') {
      return new Response(
        JSON.stringify({ error: 'API Key 未配置：当前值为默认占位符 your-api-key-here，请设置真实的 API Key' }),
        { status: 500, headers: JSON_HEADERS }
      )
    }

    const apiUrl = 'https://api.siliconflow.cn/v1/chat/completions'

    let siliconflowResponse: Response
    try {
      siliconflowResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: `连接硅基流动 API 失败: ${e.message}，请检查网络连接或 API 地址是否正确` }),
        { status: 502, headers: JSON_HEADERS }
      )
    }

    if (!siliconflowResponse.ok) {
      let errorText = ''
      try {
        errorText = await siliconflowResponse.text()
      } catch {
        errorText = '(无法读取错误响应体)'
      }

      let errorMessage = `硅基流动 API 错误 (${siliconflowResponse.status})`

      if (siliconflowResponse.status === 401) {
        errorMessage += '：API Key 无效或已过期，请检查 SILICONFLOW_API_KEY 是否正确'
      } else if (siliconflowResponse.status === 404) {
        errorMessage += '：模型不存在或 API 地址错误，请检查模型名称是否正确'
      } else if (siliconflowResponse.status === 429) {
        errorMessage += '：请求频率超限，请稍后再试'
      } else if (siliconflowResponse.status >= 500) {
        errorMessage += '：硅基流动服务器错误'
      }

      return new Response(
        JSON.stringify({ error: `${errorMessage}。详情: ${errorText}` }),
        { status: siliconflowResponse.status, headers: JSON_HEADERS }
      )
    }

    const contentType = siliconflowResponse.headers.get('content-type') || ''

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'no-cache')
    headers.set('Connection', 'keep-alive')
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return new Response(siliconflowResponse.body, {
      status: siliconflowResponse.status,
      headers,
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${error.message}` }),
      { status: 500, headers: JSON_HEADERS }
    )
  }
}
