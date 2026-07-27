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
    const body = await context.request.json() as ChatRequest

    const apiKey = context.env.SILICONFLOW_API_KEY
    if (!apiKey || apiKey === 'your-api-key-here') {
      return new Response(
        JSON.stringify({ error: 'API Key 未配置，请在 Cloudflare Pages 环境变量中设置 SILICONFLOW_API_KEY' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          } 
        }
      )
    }

    const siliconflowResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!siliconflowResponse.ok) {
      const errorText = await siliconflowResponse.text()
      return new Response(
        JSON.stringify({ error: `硅基流动 API 错误: ${errorText}` }),
        { 
          status: siliconflowResponse.status, 
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          } 
        }
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
      JSON.stringify({ error: `服务器错误: ${error.message}` }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        } 
      }
    )
  }
}
