<template>
  <n-space vertical :size="24">
    <n-card>
      <template #header>
        <n-space align="center">
          <n-icon size="24">🔗</n-icon>
          <span>流组合演示</span>
        </n-space>
      </template>
      <n-text>
        演示多个数据流的组合操作，包括 merge、concat、zip、combineLatest 等组合操作符。
      </n-text>
    </n-card>

    <n-grid :cols="24" :x-gap="24">
      <n-grid-item :span="8">
        <n-card title="组合操作配置">
          <n-space vertical>
            <n-select
              v-model:value="selectedCombination"
              :options="combinationOptions"
              placeholder="选择组合操作"
            />
            
            <n-divider />
            
            <n-form-item label="流A间隔 (ms)">
              <n-input-number
                v-model:value="streamAInterval"
                :min="500"
                :max="3000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="流B间隔 (ms)">
              <n-input-number
                v-model:value="streamBInterval"
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
          <n-card title="流组合可视化">
            <div class="combination-container">
              <div class="stream-row">
                <div class="stream-label">流A:</div>
                <div class="stream-line stream-a">
                  <div
                    v-for="item in streamAItems"
                    :key="item.id"
                    class="stream-item stream-a-item"
                    :style="{ left: item.position + 'px' }"
                  >
                    A{{ item.value }}
                  </div>
                </div>
              </div>
              
              <div class="stream-row">
                <div class="stream-label">流B:</div>
                <div class="stream-line stream-b">
                  <div
                    v-for="item in streamBItems"
                    :key="item.id"
                    class="stream-item stream-b-item"
                    :style="{ left: item.position + 'px' }"
                  >
                    B{{ item.value }}
                  </div>
                </div>
              </div>
              
              <div class="combination-arrow">
                <n-icon size="20">⬇️</n-icon>
                <span>{{ selectedCombination || '选择组合操作' }}</span>
              </div>
              
              <div class="stream-row">
                <div class="stream-label">结果:</div>
                <div class="stream-line result-stream">
                  <div
                    v-for="item in resultItems"
                    :key="item.id"
                    class="stream-item result-item"
                    :style="{ left: item.position + 'px' }"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </div>
            </div>
          </n-card>

          <n-card title="组合结果">
            <div class="result-list">
              <div
                v-for="item in resultData"
                :key="item.id"
                class="result-data-item"
              >
                <n-tag type="success">{{ item.timestamp }}</n-tag>
                <span>{{ item.value }}</span>
                <n-text depth="3" style="font-size: 12px;">{{ item.description }}</n-text>
              </div>
            </div>
          </n-card>
        </n-space>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NSelect,
  NButton,
  NFormItem,
  NInputNumber,
  NDivider,
  NTag,
  NText,
  NIcon
} from 'naive-ui'
import { useStreamCombination } from '../composables/useStreamCombination'

const selectedCombination = ref<string>('')
const streamAInterval = ref(1000)
const streamBInterval = ref(1500)
const isRunning = ref(false)

const combinationOptions = [
  { label: 'merge - 合并', value: 'merge' },
  { label: 'concat - 连接', value: 'concat' },
  { label: 'zip - 压缩', value: 'zip' },
  { label: 'combineLatest - 组合最新值', value: 'combineLatest' },
  { label: 'withLatestFrom - 携带最新值', value: 'withLatestFrom' },
  { label: 'startWith - 以...开始', value: 'startWith' }
]

const streamAItems = ref<any[]>([])
const streamBItems = ref<any[]>([])
const resultItems = ref<any[]>([])
const resultData = ref<any[]>([])

const { startCombination, stopCombination } = useStreamCombination()

let streamACounter = 0
let streamBCounter = 0
let animationStartTime = 0

const addStreamAItem = (value: any) => {
  const id = Date.now() + Math.random()
  const position = (Date.now() - animationStartTime) / 50 % 600
  
  streamAItems.value.push({ id, value, position })
  
  setTimeout(() => {
    streamAItems.value = streamAItems.value.filter(item => item.id !== id)
  }, 3000)
}

const addStreamBItem = (value: any) => {
  const id = Date.now() + Math.random()
  const position = (Date.now() - animationStartTime) / 50 % 600
  
  streamBItems.value.push({ id, value, position })
  
  setTimeout(() => {
    streamBItems.value = streamBItems.value.filter(item => item.id !== id)
  }, 3000)
}

const addResultItem = (value: any, description: string) => {
  const timestamp = new Date().toLocaleTimeString()
  const id = Date.now() + Math.random()
  
  // 添加到数据列表
  resultData.value.unshift({ id, value, timestamp, description })
  if (resultData.value.length > 20) resultData.value.pop()
  
  // 添加到可视化流
  const position = (Date.now() - animationStartTime) / 50 % 600
  resultItems.value.push({ id, value, position })
  
  setTimeout(() => {
    resultItems.value = resultItems.value.filter(item => item.id !== id)
  }, 3000)
}

const startDemo = () => {
  if (!selectedCombination.value) return
  
  isRunning.value = true
  streamACounter = 0
  streamBCounter = 0
  animationStartTime = Date.now()
  
  startCombination(
    selectedCombination.value,
    streamAInterval.value,
    streamBInterval.value,
    {
      onStreamA: (value) => {
        addStreamAItem(value)
      },
      onStreamB: (value) => {
        addStreamBItem(value)
      },
      onResult: (value, description) => {
        addResultItem(value, description)
      }
    }
  )
}

const stopDemo = () => {
  isRunning.value = false
  stopCombination()
}

const clearResults = () => {
  streamAItems.value = []
  streamBItems.value = []
  resultItems.value = []
  resultData.value = []
}
</script>

<style scoped>
.combination-container {
  height: 300px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stream-row {
  display: flex;
  align-items: center;
  height: 60px;
  margin-bottom: 15px;
}

.stream-label {
  width: 80px;
  font-weight: 500;
  color: #64748b;
}

.stream-line {
  position: relative;
  flex: 1;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
}

.stream-a {
  background: linear-gradient(to right, #3b82f6, #1d4ed8);
}

.stream-b {
  background: linear-gradient(to right, #10b981, #047857);
}

.result-stream {
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
}

.stream-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 45px;
  height: 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 12px;
  color: white;
  animation: moveStream 3s linear forwards;
}

.stream-a-item {
  background: #3b82f6;
}

.stream-b-item {
  background: #10b981;
}

.result-item {
  background: #8b5cf6;
}

.combination-arrow {
  text-align: center;
  margin: 10px 0;
  color: #64748b;
  font-weight: 500;
}

.result-list {
  height: 200px;
  overflow-y: auto;
}

.result-data-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.result-data-item:last-child {
  border-bottom: none;
}
</style>
