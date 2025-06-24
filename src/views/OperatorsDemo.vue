<template>
  <n-space vertical :size="24">
    <n-card>
      <template #header>
        <n-space align="center">
          <n-icon size="24">⚡</n-icon>
          <span>操作符演示</span>
        </n-space>
      </template>
      <n-text>
        演示 FastRx 的各种操作符，包括转换、过滤、时间操作等。通过可视化的方式展示数据流的变化过程。
      </n-text>
    </n-card>

    <n-grid :cols="24" :x-gap="24">
      <n-grid-item :span="8">
        <n-card title="操作符选择">
          <n-space vertical>
            <n-select
              v-model:value="selectedOperator"
              :options="operatorOptions"
              placeholder="选择操作符"
              @update:value="runOperatorDemo"
            />
            
            <n-divider />
            
            <n-form-item label="输入间隔 (ms)">
              <n-input-number
                v-model:value="inputInterval"
                :min="500"
                :max="3000"
                :step="500"
                style="width: 100%"
              />
            </n-form-item>
            
            <n-form-item label="操作符参数">
              <n-input-number
                v-model:value="operatorParam"
                :min="1"
                :max="10"
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
          <n-card title="数据流可视化">
            <div class="stream-container">
              <div class="stream-row">
                <div class="stream-label">输入流:</div>
                <div class="stream-line">
                  <div
                    v-for="item in inputStream"
                    :key="item.id"
                    class="stream-item input"
                    :style="{ left: item.position + 'px' }"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </div>
              
              <div class="operator-arrow">
                <n-icon size="20">⬇️</n-icon>
                <span>{{ selectedOperator || '选择操作符' }}</span>
              </div>
              
              <div class="stream-row">
                <div class="stream-label">输出流:</div>
                <div class="stream-line">
                  <div
                    v-for="item in outputStream"
                    :key="item.id"
                    class="stream-item output"
                    :style="{ left: item.position + 'px' }"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </div>
            </div>
          </n-card>

          <n-grid :cols="2" :x-gap="16">
            <n-grid-item>
              <n-card title="输入数据">
                <div class="data-list">
                  <div
                    v-for="item in inputData"
                    :key="item.id"
                    class="data-item"
                  >
                    <n-tag type="info">{{ item.timestamp }}</n-tag>
                    <span>{{ item.value }}</span>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
            
            <n-grid-item>
              <n-card title="输出数据">
                <div class="data-list">
                  <div
                    v-for="item in outputData"
                    :key="item.id"
                    class="data-item"
                  >
                    <n-tag type="success">{{ item.timestamp }}</n-tag>
                    <span>{{ item.value }}</span>
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
import { ref, reactive } from 'vue'
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
import { useOperators } from '../composables/useOperators'

const selectedOperator = ref<string>('')
const inputInterval = ref(1000)
const operatorParam = ref(2)
const isRunning = ref(false)

const operatorOptions = [
  { label: 'map - 映射变换', value: 'map' },
  { label: 'filter - 过滤', value: 'filter' },
  { label: 'take - 取前N个', value: 'take' },
  { label: 'skip - 跳过前N个', value: 'skip' },
  { label: 'debounceTime - 防抖', value: 'debounceTime' },
  { label: 'throttle - 节流', value: 'throttle' },
  { label: 'scan - 累积', value: 'scan' },
  { label: 'switchMap - 切换映射', value: 'switchMap' }
]

const inputStream = ref<any[]>([])
const outputStream = ref<any[]>([])
const inputData = ref<any[]>([])
const outputData = ref<any[]>([])

const { runOperator, stopOperator } = useOperators()

let demoInterval: number | null = null
let inputCounter = 0
let animationStartTime = 0

const addInputItem = (value: any) => {
  const timestamp = new Date().toLocaleTimeString()
  const id = Date.now() + Math.random()
  
  // 添加到数据列表
  inputData.value.unshift({ id, value, timestamp })
  if (inputData.value.length > 20) inputData.value.pop()
  
  // 添加到可视化流
  const position = (Date.now() - animationStartTime) / 50 % 600
  inputStream.value.push({ id, value, position })
  
  // 清理旧的流项目
  setTimeout(() => {
    inputStream.value = inputStream.value.filter(item => item.id !== id)
  }, 3000)
}

const addOutputItem = (value: any) => {
  const timestamp = new Date().toLocaleTimeString()
  const id = Date.now() + Math.random()
  
  // 添加到数据列表
  outputData.value.unshift({ id, value, timestamp })
  if (outputData.value.length > 20) outputData.value.pop()
  
  // 添加到可视化流
  const position = (Date.now() - animationStartTime) / 50 % 600
  outputStream.value.push({ id, value, position })
  
  // 清理旧的流项目
  setTimeout(() => {
    outputStream.value = outputStream.value.filter(item => item.id !== id)
  }, 3000)
}

const startDemo = () => {
  if (!selectedOperator.value) return
  
  isRunning.value = true
  inputCounter = 0
  animationStartTime = Date.now()
  
  // 启动操作符演示
  runOperator(selectedOperator.value, operatorParam.value, addOutputItem)
  
  // 定期产生输入数据
  demoInterval = setInterval(() => {
    const value = ++inputCounter
    addInputItem(value)
  }, inputInterval.value)
}

const stopDemo = () => {
  isRunning.value = false
  if (demoInterval) {
    clearInterval(demoInterval)
    demoInterval = null
  }
  stopOperator()
}

const clearResults = () => {
  inputStream.value = []
  outputStream.value = []
  inputData.value = []
  outputData.value = []
}

const runOperatorDemo = () => {
  if (isRunning.value) {
    stopDemo()
  }
  clearResults()
}
</script>

<style scoped>
.stream-container {
  height: 200px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stream-row {
  display: flex;
  align-items: center;
  height: 60px;
  margin-bottom: 20px;
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
  background: linear-gradient(to right, #e2e8f0, #cbd5e1);
  border-radius: 20px;
  overflow: hidden;
}

.stream-item {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: white;
  animation: moveStream 3s linear forwards;
}

.stream-item.input {
  background: #3b82f6;
}

.stream-item.output {
  background: #10b981;
}

@keyframes moveStream {
  from {
    left: 0px;
  }
  to {
    left: 600px;
  }
}

.operator-arrow {
  text-align: center;
  margin: 10px 0;
  color: #64748b;
  font-weight: 500;
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
