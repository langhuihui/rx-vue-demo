<template>
  <n-space vertical :size="24">
    <n-card>
      <template #header>
        <n-space align="center">
          <n-icon size="24">🛡️</n-icon>
          <span>错误处理演示</span>
        </n-space>
      </template>
      <n-text>
        演示 FastRx 中的错误处理机制，包括 catchError、retry、finalize 等错误恢复操作符。
      </n-text>
    </n-card>

    <n-grid :cols="24" :x-gap="24">
      <n-grid-item :span="8">
        <n-card title="错误处理配置">
          <n-space vertical>
            <n-select
              v-model:value="selectedErrorHandler"
              :options="errorHandlerOptions"
              placeholder="选择错误处理方式"
            />
            
            <n-divider />
            
            <n-form-item label="错误率 (%)">
              <n-slider
                v-model:value="errorRate"
                :min="0"
                :max="100"
                :step="10"
                :format-tooltip="(value) => `${value}%`"
              />
            </n-form-item>
            
            <n-form-item label="重试次数">
              <n-input-number
                v-model:value="retryCount"
                :min="0"
                :max="10"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="数据间隔 (ms)">
              <n-input-number
                v-model:value="dataInterval"
                :min="500"
                :max="3000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-button type="primary" @click="startDemo" :loading="isRunning" block>
              {{ isRunning ? '运行中...' : '开始演示' }}
            </n-button>
            
            <n-button @click="stopDemo" :disabled="!isRunning" block>
              停止演示
            </n-button>
            
            <n-button @click="clearResults" block>
              清空结果
            </n-button>
          </n-space>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="16">
        <n-space vertical :size="16">
          <n-card title="错误处理流程">
            <div class="error-flow-container">
              <div class="flow-step" v-for="step in errorFlowSteps" :key="step.id">
                <div class="step-icon" :class="step.status">
                  {{ step.icon }}
                </div>
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-description">{{ step.description }}</div>
                  <div class="step-time">{{ step.timestamp }}</div>
                </div>
              </div>
            </div>
          </n-card>

          <n-grid :cols="2" :x-gap="16">
            <n-grid-item>
              <n-card title="成功数据">
                <div class="data-list">
                  <div
                    v-for="item in successData"
                    :key="item.id"
                    class="data-item success"
                  >
                    <n-tag type="success">{{ item.timestamp }}</n-tag>
                    <span>{{ item.value }}</span>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card title="错误信息">
                <div class="data-list">
                  <div
                    v-for="item in errorData"
                    :key="item.id"
                    class="data-item error"
                  >
                    <n-tag type="error">{{ item.timestamp }}</n-tag>
                    <span>{{ item.message }}</span>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>

          <n-card title="统计信息">
            <n-space>
              <n-statistic label="总数据量" :value="totalCount" />
              <n-statistic label="成功处理" :value="successCount" />
              <n-statistic label="错误数量" :value="errorCount" />
              <n-statistic label="成功率" :value="successRate" suffix="%" />
            </n-space>
          </n-card>
        </n-space>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NSelect,
  NButton,
  NFormItem,
  NInputNumber,
  NSlider,
  NDivider,
  NTag,
  NStatistic,
  NText,
  NIcon
} from 'naive-ui'
import { useErrorHandling } from '../composables/useErrorHandling'

const selectedErrorHandler = ref<string>('')
const errorRate = ref(30)
const retryCount = ref(3)
const dataInterval = ref(1000)
const isRunning = ref(false)

const errorHandlerOptions = [
  { label: 'catchError - 捕获错误', value: 'catchError' },
  { label: 'retry - 重试', value: 'retry' },
  { label: 'retryWhen - 条件重试', value: 'retryWhen' },
  { label: 'finalize - 最终处理', value: 'finalize' },
  { label: 'onErrorResumeNext - 错误恢复', value: 'onErrorResumeNext' }
]

const errorFlowSteps = ref<any[]>([])
const successData = ref<any[]>([])
const errorData = ref<any[]>([])
const totalCount = ref(0)
const successCount = ref(0)
const errorCount = ref(0)

const successRate = computed(() => {
  return totalCount.value > 0 ? Math.round((successCount.value / totalCount.value) * 100) : 0
})

const { startErrorHandling, stopErrorHandling } = useErrorHandling()

const addFlowStep = (icon: string, title: string, description: string, status: string) => {
  const timestamp = new Date().toLocaleTimeString()
  errorFlowSteps.value.unshift({
    id: Date.now() + Math.random(),
    icon,
    title,
    description,
    timestamp,
    status
  })
  
  if (errorFlowSteps.value.length > 10) {
    errorFlowSteps.value.pop()
  }
}

const addSuccessData = (value: any) => {
  const timestamp = new Date().toLocaleTimeString()
  successData.value.unshift({
    id: Date.now() + Math.random(),
    value,
    timestamp
  })
  
  if (successData.value.length > 20) {
    successData.value.pop()
  }
  
  successCount.value++
}

const addErrorData = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  errorData.value.unshift({
    id: Date.now() + Math.random(),
    message,
    timestamp
  })
  
  if (errorData.value.length > 20) {
    errorData.value.pop()
  }
  
  errorCount.value++
}

const startDemo = () => {
  if (!selectedErrorHandler.value) return
  
  isRunning.value = true
  
  startErrorHandling(
    selectedErrorHandler.value,
    {
      errorRate: errorRate.value,
      retryCount: retryCount.value,
      dataInterval: dataInterval.value
    },
    {
      onData: (value) => {
        totalCount.value++
        addFlowStep('📊', '数据处理', `处理数据: ${value}`, 'processing')
      },
      onSuccess: (value) => {
        addSuccessData(value)
        addFlowStep('✅', '处理成功', `成功处理: ${value}`, 'success')
      },
      onError: (error) => {
        addErrorData(error.message)
        addFlowStep('❌', '处理错误', error.message, 'error')
      },
      onRetry: (attempt) => {
        addFlowStep('🔄', '重试处理', `第 ${attempt} 次重试`, 'retry')
      },
      onRecover: (value) => {
        addFlowStep('🛡️', '错误恢复', `恢复处理: ${value}`, 'recover')
      }
    }
  )
}

const stopDemo = () => {
  isRunning.value = false
  stopErrorHandling()
}

const clearResults = () => {
  errorFlowSteps.value = []
  successData.value = []
  errorData.value = []
  totalCount.value = 0
  successCount.value = 0
  errorCount.value = 0
}
</script>

<style scoped>
.error-flow-container {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.flow-step:last-child {
  border-bottom: none;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.step-icon.processing {
  background: #3b82f6;
  color: white;
}

.step-icon.success {
  background: #10b981;
  color: white;
}

.step-icon.error {
  background: #ef4444;
  color: white;
}

.step-icon.retry {
  background: #f59e0b;
  color: white;
}

.step-icon.recover {
  background: #8b5cf6;
  color: white;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.step-description {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 4px;
}

.step-time {
  color: #94a3b8;
  font-size: 12px;
}

.data-list {
  height: 200px;
  overflow-y: auto;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.data-item:last-child {
  border-bottom: none;
}
</style>
