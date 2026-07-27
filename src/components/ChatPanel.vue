<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { ChatMessage } from '@/utils/api'
import { streamChat } from '@/utils/api'

interface Props {
  causalText: string
}

const props = defineProps<Props>()

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const chatContainerRef = ref<HTMLDivElement | null>(null)
const currentReply = ref('')

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(currentReply, () => {
  scrollToBottom()
})

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return

  const userMessage = inputText.value.trim()
  inputText.value = ''

  messages.value.push({
    role: 'user',
    content: userMessage
  })

  isLoading.value = true
  currentReply.value = ''

  const userMessages = [...messages.value]
  if (props.causalText) {
    const lastIndex = userMessages.length - 1
    userMessages[lastIndex] = {
      role: 'user',
      content: `${props.causalText}\n\n用户问题：${userMessage}`
    }
  }

  await streamChat(
    userMessages,
    (chunk) => {
      currentReply.value += chunk
    },
    () => {
      if (currentReply.value) {
        messages.value.push({
          role: 'assistant',
          content: currentReply.value
        })
      }
      currentReply.value = ''
      isLoading.value = false
    },
    (error) => {
      messages.value.push({
        role: 'assistant',
        content: `抱歉，发生了错误：${error}`
      })
      currentReply.value = ''
      isLoading.value = false
    }
  )
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const clearChat = () => {
  messages.value = []
  currentReply.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full bg-cld-surface border-l border-cld-border">
    <div class="flex items-center justify-between px-4 py-3 border-b border-cld-border">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cld-accent to-purple-500 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div>
          <h3 class="text-cld-text font-medium">AI 系统分析</h3>
          <p class="text-cld-text-muted text-xs">基于系统动力学</p>
        </div>
      </div>
      <button
        @click="clearChat"
        class="p-1.5 rounded-md text-cld-text-muted hover:text-cld-text hover:bg-cld-border/50 transition-colors"
        title="清空对话"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="messages.length === 0 && !currentReply" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cld-accent/20 to-purple-500/20 flex items-center justify-center">
          <svg class="w-8 h-8 text-cld-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h4 class="text-cld-text font-medium mb-2">开始系统分析</h4>
        <p class="text-cld-text-muted text-sm max-w-xs mx-auto">
          在左侧绘制因果回路图，然后向我提问，我将为你进行深度系统动力学分析。
        </p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="[
          'flex animate-slide-up',
          msg.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <div
          :class="[
            'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
            msg.role === 'user'
              ? 'bg-cld-accent text-white rounded-br-md'
              : 'bg-cld-bg text-cld-text rounded-bl-md border border-cld-border'
          ]"
        >
          {{ msg.content }}
        </div>
      </div>

      <div v-if="currentReply || isLoading" class="flex justify-start animate-slide-up">
        <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-cld-bg text-cld-text rounded-bl-md border border-cld-border whitespace-pre-wrap">
          {{ currentReply }}
          <span v-if="isLoading && !currentReply" class="inline-flex gap-1">
            <span class="w-2 h-2 bg-cld-text-muted rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-cld-text-muted rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-cld-text-muted rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </span>
          <span v-if="isLoading" class="inline-block w-2 h-4 bg-cld-text ml-1 align-middle animate-pulse"></span>
        </div>
      </div>
    </div>

    <div class="p-4 border-t border-cld-border">
      <div class="relative">
        <textarea
          v-model="inputText"
          @keydown="handleKeydown"
          :disabled="isLoading"
          placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
          rows="3"
          class="w-full px-4 py-3 pr-12 rounded-xl bg-cld-bg border border-cld-border text-cld-text text-sm placeholder-cld-text-muted focus:outline-none focus:border-cld-accent/50 focus:ring-2 focus:ring-cld-accent/20 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="isLoading || !inputText.trim()"
          class="absolute right-2 bottom-2 p-2 rounded-lg bg-cld-accent text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
