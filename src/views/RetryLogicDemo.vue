<template>
  <n-space vertical :size="24">
    <!-- 页面标题和描述 -->
    <n-card>
      <template #header>
        <n-space align="center">
          <n-icon size="24">🔄</n-icon>
          <span>重试逻辑演示</span>
        </n-space>
      </template>
      <n-text>
        基于原始代码的 sendReq 方法，使用真实的 FastRx 库演示完整的重试逻辑。
        包含超时、重试、间隔等机制，通过时间轴动画可视化请求生命周期。
      </n-text>
    </n-card>

    <n-grid :cols="24" :x-gap="24">
      <!-- 配置面板 -->
      <n-grid-item :span="8">
        <n-card title="📋 配置参数">
          <n-form :model="config" label-placement="top">
            <n-form-item label="请求超时 (ms)">
              <n-input-number
                v-model:value="config.timeout"
                :min="1000"
                :max="10000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="重试次数">
              <n-input-number
                v-model:value="config.retries"
                :min="0"
                :max="5"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="重试间隔 (ms)">
              <n-input-number
                v-model:value="config.retryInterval"
                :min="500"
                :max="5000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="模拟服务器延时 (ms)">
              <n-input-number
                v-model:value="config.serverDelay"
                :min="0"
                :max="10000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="失败率 (%)">
              <n-slider
                v-model:value="config.failureRate"
                :min="0"
                :max="100"
                :step="5"
                :format-tooltip="(value) => `${value}%`"
              />
            </n-form-item>
            
            <n-form-item label="命令类型">
              <n-select
                v-model:value="config.command"
                :options="commandOptions"
                style="width: 100%"
              />
            </n-form-item>
          </n-form>
          
          <n-space>
            <n-button
              type="primary"
              :loading="isRequesting"
              @click="startRequest"
              style="flex: 1"
            >
              🚀 发送请求
            </n-button>
            <n-button @click="clearTimeline">
              🗑️ 清空时间轴
            </n-button>
          </n-space>
        </n-card>
      </n-grid-item>

      <!-- 时间轴和状态 -->
      <n-grid-item :span="16">
        <n-space vertical :size="16">
          <!-- 时间轴 -->
          <n-card title="⏱️ 事件时间轴">
            <div class="timeline-container">
              <div class="timeline" ref="timelineRef">
                <div class="timeline-ruler">
                  <div class="time-mark" v-for="i in 5" :key="i" :style="{ left: (i-1) * 160 + 20 + 'px' }">
                    {{ (i-1) * 5 }}s
                  </div>
                </div>
                <div class="events-track">
                  <div
                    v-for="event in timelineEvents"
                    :key="event.id"
                    :class="['event-item', event.type]"
                    :style="{ left: event.position + 'px', top: getEventTop(event.type) + 'px' }"
                    :title="`${(event.time / 1000).toFixed(1)}s: ${event.text}`"
                  >
                    {{ event.text }}
                  </div>
                </div>
                <div
                  class="timeline-cursor"
                  :class="{ active: isRequesting }"
                  :style="{ left: cursorPosition + 'px' }"
                ></div>
              </div>
            </div>
          </n-card>

          <!-- 状态和日志 -->
          <n-grid :cols="2" :x-gap="16">
            <n-grid-item>
              <n-card title="📊 当前状态">
                <n-descriptions :column="1" label-placement="left">
                  <n-descriptions-item label="请求状态">
                    <n-tag :type="getStatusType(requestStatus)">{{ requestStatus }}</n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="当前尝试">{{ currentAttempt }}</n-descriptions-item>
                  <n-descriptions-item label="请求UUID">{{ requestUuid || '-' }}</n-descriptions-item>
                  <n-descriptions-item label="耗时">{{ elapsedTime }}ms</n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card title="📝 执行日志">
                <div class="log-container">
                  <div
                    v-for="log in logs"
                    :key="log.id"
                    :class="['log-item', log.level]"
                  >
                    <span class="timestamp">[{{ log.timestamp }}]</span>
                    <span class="message">{{ log.message }}</span>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-space>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NForm,
  NFormItem,
  NInputNumber,
  NSlider,
  NSelect,
  NButton,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NText,
  NIcon
} from 'naive-ui'
import { useRetryLogic } from '../composables/useRetryLogic'

// 配置
const config = reactive({
  timeout: 2000,
  retries: 3,
  retryInterval: 1000,
  serverDelay: 10000,
  failureRate: 0,
  command: 'LOGIN'
})

const commandOptions = [
  { label: 'LOGIN', value: 'LOGIN' },
  { label: 'GET_DATA', value: 'GET_DATA' },
  { label: 'SEND_MESSAGE', value: 'SEND_MESSAGE' },
  { label: 'UPDATE_PROFILE', value: 'UPDATE_PROFILE' }
]

// 状态
const isRequesting = ref(false)
const requestStatus = ref('空闲')
const currentAttempt = ref('0/0')
const requestUuid = ref<number | null>(null)
const elapsedTime = ref(0)
const timelineEvents = ref<any[]>([])
const logs = ref<any[]>([])
const cursorPosition = ref(20)

// 时间轴相关
const timelineRef = ref<HTMLElement>()
let animationId: number | null = null
let timelineStartTime: number | null = null

// 使用重试逻辑
const { sendReq } = useRetryLogic()

const getStatusType = (status: string) => {
  switch (status) {
    case '成功': return 'success'
    case '失败': return 'error'
    case '进行中': return 'warning'
    default: return 'default'
  }
}

const getEventTop = (type: string) => {
  switch (type) {
    case 'start': return 20
    case 'attempt': return 60
    case 'timeout': return 100
    case 'success': return 20
    case 'error': return 20
    default: return 20
  }
}

const addLog = (level: string, message: string) => {
  const now = new Date()
  const timestamp = now.toTimeString().split(' ')[0]
  logs.value.push({
    id: Date.now() + Math.random(),
    level,
    message,
    timestamp
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.shift()
  }
}

const addTimelineEvent = (type: string, text: string, timeMs: number) => {
  const position = Math.min((timeMs / 1000) * 32, 640) + 20
  timelineEvents.value.push({
    id: Date.now() + Math.random(),
    type,
    text,
    time: timeMs,
    position
  })
}

const startTimelineAnimation = () => {
  timelineStartTime = Date.now()
  
  const animate = () => {
    if (!timelineStartTime || !isRequesting.value) return
    
    const elapsed = Date.now() - timelineStartTime
    const position = Math.min((elapsed / 1000) * 32, 660) + 20
    cursorPosition.value = position
    
    if (isRequesting.value) {
      animationId = requestAnimationFrame(animate)
    }
  }
  
  animate()
}

const stopTimelineAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

const clearTimeline = () => {
  timelineEvents.value = []
  cursorPosition.value = 20
  timelineStartTime = null
  stopTimelineAnimation()
}

const startRequest = async () => {
  if (isRequesting.value) {
    addLog('warning', '已有请求在进行中，请等待完成')
    return
  }

  isRequesting.value = true
  requestStatus.value = '进行中'
  const startTime = Date.now()
  
  clearTimeline()
  startTimelineAnimation()
  
  addLog('info', `发起请求: 命令=${config.command}`)
  addTimelineEvent('start', '开始请求', 0)
  
  try {
    const result = await sendReq(config.command, {}, {
      timeout: config.timeout,
      retries: config.retries,
      retryInterval: config.retryInterval,
      serverDelay: config.serverDelay,
      failureRate: config.failureRate,
      onAttempt: (attempt: number, total: number, uuid: number) => {
        currentAttempt.value = `${attempt}/${total}`
        requestUuid.value = uuid
        elapsedTime.value = Date.now() - startTime
        
        if (attempt > 1) {
          addLog('warning', `重试第 ${attempt - 1} 次 (${attempt}/${total})`)
          addTimelineEvent('attempt', `重试 #${attempt - 1}`, Date.now() - (timelineStartTime || startTime))
        }
      },
      onTimeout: () => {
        addLog('error', '请求超时')
        addTimelineEvent('timeout', '请求超时', Date.now() - (timelineStartTime || startTime))
      }
    })
    
    requestStatus.value = '成功'
    addLog('success', `请求成功完成: ${JSON.stringify(result)}`)
    addTimelineEvent('success', '请求成功', Date.now() - (timelineStartTime || startTime))
    
  } catch (error: any) {
    requestStatus.value = '失败'
    addLog('error', `请求最终失败: ${error.message || error}`)
    addTimelineEvent('error', '请求失败', Date.now() - (timelineStartTime || startTime))
  } finally {
    isRequesting.value = false
    elapsedTime.value = Date.now() - startTime
    stopTimelineAnimation()
  }
}

onMounted(() => {
  addLog('info', '演示系统就绪，请配置参数后发送请求')
})

onUnmounted(() => {
  stopTimelineAnimation()
})
</script>

<style scoped>
.timeline-container {
  height: 200px;
  overflow-x: auto;
  overflow-y: hidden;
}

.timeline {
  position: relative;
  height: 200px;
  min-width: 800px;
  background: linear-gradient(90deg, #f1f5f9 0%, #f8fafc 100%);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
}

.time-mark {
  position: absolute;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.events-track {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
}

.timeline-cursor {
  position: absolute;
  top: 30px;
  width: 2px;
  height: calc(100% - 30px);
  background: #3b82f6;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
}

.timeline-cursor.active {
  opacity: 1;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.event-item {
  position: absolute;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  min-width: 80px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.event-item:hover {
  transform: translateY(-2px);
}

.event-item.start {
  background: #3b82f6;
}

.event-item.attempt {
  background: #f59e0b;
}

.event-item.timeout {
  background: #ef4444;
}

.event-item.success {
  background: #10b981;
}

.event-item.error {
  background: #ef4444;
}

.log-container {
  height: 200px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--border-color);
}

.log-item {
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.log-item.info {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}

.log-item.success {
  background: rgba(16, 185, 129, 0.1);
  border-left: 3px solid #10b981;
}

.log-item.error {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
}

.log-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
}

.log-item .timestamp {
  color: #64748b;
  font-weight: 500;
  margin-right: 8px;
}

.log-item .message {
  color: #1e293b;
}
</style>
