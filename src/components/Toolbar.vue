<script setup lang="ts">
interface Props {
  selectedEdgeId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'add-node'): void
  (e: 'delete'): void
  (e: 'clear'): void
  (e: 'export'): void
  (e: 'open-graphs'): void
  (e: 'set-polarity', polarity: 'S' | 'O'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2 bg-cld-surface/80 backdrop-blur-sm border-b border-cld-border">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 mr-4">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cld-accent to-blue-500 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <span class="text-cld-text font-semibold text-lg">CLD-AI</span>
        <span class="text-cld-text-muted text-sm">因果回路图智能分析</span>
      </div>

      <div class="h-6 w-px bg-cld-border mx-2"></div>

      <button
        @click="emit('add-node')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cld-text hover:bg-cld-border/50 transition-colors"
        title="添加节点"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>添加节点</span>
      </button>

      <button
        @click="emit('delete')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cld-text hover:bg-cld-border/50 transition-colors"
        title="删除选中"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        <span>删除</span>
      </button>

      <button
        @click="emit('clear')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cld-text hover:bg-cld-border/50 transition-colors"
        title="清空画布"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span>清空</span>
      </button>

      <button
        @click="emit('open-graphs')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cld-text hover:bg-cld-border/50 transition-colors"
        title="我的图表"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        <span>我的图表</span>
      </button>

      <div class="h-6 w-px bg-cld-border mx-1"></div>

      <button
        @click="emit('export')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-cld-text hover:bg-cld-border/50 transition-colors"
        title="导出PDF"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span>导出PDF</span>
      </button>
    </div>

    <div v-if="props.selectedEdgeId" class="flex items-center gap-2 animate-fade-in">
      <span class="text-cld-text-muted text-sm">连线极性：</span>
      <button
        @click="emit('set-polarity', 'S')"
        class="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium bg-cld-positive/20 text-cld-positive border border-cld-positive/30 hover:bg-cld-positive/30 transition-colors"
      >
        <span class="text-base leading-none font-black">S</span>
        <span>同向</span>
      </button>
      <button
        @click="emit('set-polarity', 'O')"
        class="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium bg-cld-negative/20 text-cld-negative border border-cld-negative/30 hover:bg-cld-negative/30 transition-colors"
      >
        <span class="text-base leading-none font-black">O</span>
        <span>反向</span>
      </button>
    </div>
  </div>
</template>
