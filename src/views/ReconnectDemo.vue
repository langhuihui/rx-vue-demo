<template>
  <div class="reconnect-demo">
    <h1>
      <Icon icon="mdi:connection" style="margin-right: 8px" />
      重连逻辑演示
    </h1>

    <div class="status-section">
      <h2>连接状态</h2>
      <div class="status-indicator" :class="connectionState">
        {{ getStatusText() }}
      </div>
      <div class="connection-info">
        <p>重连次数: {{ reconnectCount }}</p>
        <p>最后重连时间: {{ lastReconnectTime || "无" }}</p>
        <p>总重连次数: {{ totalAttempts }}</p>
      </div>
    </div>

    <div class="controls-section">
      <h2>控制面板</h2>
      <div class="button-group">
        <button @click="handleConnect" :disabled="isConnected">连接</button>
        <button @click="handleSimulateDisconnect" :disabled="!isConnected">
          模拟网络断开
        </button>
        <button @click="handleLeave" :disabled="!isConnected">离开频道</button>
      </div>
    </div>

    <!-- 时间轴动画 -->
    <div class="timeline-section">
      <h2>重连事件时间轴</h2>
      <div class="timeline-container">
        <div class="timeline" ref="timelineRef">
          <div class="timeline-ruler">
            <div
              class="time-mark"
              v-for="i in 16"
              :key="i"
              :style="{ left: (i - 1) * 100 + 20 + 'px' }"
            >
              {{ (i - 1) * 2 }}s
            </div>
          </div>
          <div class="events-track">
            <div
              v-for="event in timelineEvents"
              :key="event.id"
              :class="['event-item', event.type]"
              :style="{
                left: event.position + 'px',
                top: getEventTop(event.type) + 'px',
              }"
              :title="`${(event.time / 1000).toFixed(1)}s: ${event.text}`"
            >
              {{ event.text }}
            </div>
          </div>
          <div
            class="timeline-cursor"
            :class="{ active: isAnimating }"
            :style="{ left: cursorPosition + 'px' }"
          ></div>
        </div>
      </div>
      <button @click="clearTimeline" class="clear-btn" style="margin-top: 10px">
        清空时间轴
      </button>
    </div>

    <div class="log-section">
      <h2>操作日志</h2>
      <div class="log-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <button @click="clearLogs" class="clear-btn">清空日志</button>
    </div>

    <div class="settings-section">
      <h2>重连设置</h2>
      <div class="setting-item">
        <label>重连间隔 (毫秒):</label>
        <input
          v-model.number="reconnectInterval"
          type="number"
          min="1000"
          step="500"
          @change="updateSettings"
        />
      </div>
      <div class="setting-item">
        <label>最大重连次数:</label>
        <input
          v-model.number="maxReconnectAttempts"
          type="number"
          min="1"
          max="10"
          @change="updateSettings"
        />
      </div>
      <div class="setting-item">
        <label>
          <input v-model="autoReconnect" type="checkbox" />
          启用自动重连
        </label>
      </div>
    </div>

    <div class="code-section">
      <h2>原始代码逻辑</h2>
      <div class="code-container">
        <pre><code>// 重连尝试的 Observable
const reconnectOB = (sink: ISink&lt;Error&gt;) => this.signalChannel.reconnect().then(
  () => sink.complete(),
  err => sink.next(err)
);

pipe(
  this.signalChannel.connOB,                           // Start when connection is established
  switchMap(() => pipe(                 // Switch to a new observable when disconnected
    fromEvent(this.signalChannel.connection, ConnectionState.DISCONNECTED), 
    tap(() => {
      this.signalChannel.disconnect();
    }),         // When disconnected, start with retry count 0
    expand((): Observable&lt;number&gt; => pipe(
      mcTimeout(2000),  // Wait based on retry count
      switchMapTo(reconnectOB)                  // Attempt reconnection
    ))
    // take(SIGNAL_RECONNECTION_COUNT + 1)               // Limit retry attempts
  )),
  takeUntil(this.signalChannel.leaveOB), // Stop if channel is reinitialized
  subscribe()                                         // Execute the observable
);</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  useReconnectLogic,
  ConnectionState,
} from "../composables/useReconnectLogic";

// 使用重连逻辑组合式函数
const {
  connectionState,
  reconnectCount,
  totalAttempts,
  lastReconnectTime,
  isConnected,
  connect,
  simulateDisconnect,
  leave,
  reconnectManager,
} = useReconnectLogic();

// 设置
const reconnectInterval = ref(2000);
const maxReconnectAttempts = ref(5);
const autoReconnect = ref(true);

// 日志
const logs = ref<
  Array<{
    time: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>
>([]);

// 时间轴动画相关
const timelineEvents = ref<any[]>([]);
const cursorPosition = ref(20);
const isReconnecting = ref(false);
const isAnimating = ref(false);
const timelineRef = ref<HTMLElement>();
let animationId: number | null = null;
let timelineStartTime: number | null = null;

// 添加日志
const addLog = (
  message: string,
  type: "info" | "success" | "error" | "warning" = "info"
) => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ time, message, type });
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50);
  }
};

// 获取状态文本
const getStatusText = () => {
  switch (connectionState.value) {
    case ConnectionState.DISCONNECTED:
      return "已断开";
    case ConnectionState.CONNECTING:
      return "连接中...";
    case ConnectionState.CONNECTED:
      return "已连接";
    case ConnectionState.RECONNECTING:
      return `重连中... (${reconnectCount.value}/${maxReconnectAttempts.value})`;
    default:
      return "未知状态";
  }
};

// 更新设置
const updateSettings = () => {
  reconnectManager.setReconnectInterval(reconnectInterval.value);
  reconnectManager.setMaxReconnectAttempts(maxReconnectAttempts.value);
  addLog(
    `更新设置: 间隔=${reconnectInterval.value}ms, 最大次数=${maxReconnectAttempts.value}`,
    "info"
  );
};

// 时间轴动画相关函数
const getEventTop = (type: string) => {
  switch (type) {
    case "connect":
      return 20;
    case "disconnect":
      return 60;
    case "reconnect":
      return 100;
    case "success":
      return 20;
    case "error":
      return 20;
    case "leave":
      return 140;
    default:
      return 20;
  }
};

const addTimelineEvent = (type: string, text: string, timeMs: number) => {
  const position = (timeMs / 1000) * 50 + 20;
  timelineEvents.value.push({
    id: Date.now() + Math.random(),
    type,
    text,
    time: timeMs,
    position,
  });
};

const startTimelineAnimation = () => {
  timelineStartTime = Date.now();
  isAnimating.value = true;

  const animate = () => {
    if (!timelineStartTime || !isAnimating.value) return;

    const elapsed = Date.now() - timelineStartTime;
    const position = (elapsed / 1000) * 50 + 20;
    cursorPosition.value = position;

    if (isAnimating.value) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animate();
};

const stopTimelineAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isAnimating.value = false;
};

const clearTimeline = () => {
  timelineEvents.value = [];
  cursorPosition.value = 20;
  timelineStartTime = null;
  stopTimelineAnimation();
};

// 重写连接方法，添加日志和动画
const handleConnect = async () => {
  addLog("开始连接...", "info");
  clearTimeline();
  addTimelineEvent("connect", "开始连接", 0);
  startTimelineAnimation(); // 连接时开始动画

  try {
    await connect();
    addLog("连接成功", "success");
    const currentTime = timelineStartTime ? Date.now() - timelineStartTime : 0;
    addTimelineEvent("success", "连接成功", currentTime);
  } catch (error) {
    addLog(`连接失败: ${error}`, "error");
    const currentTime = timelineStartTime ? Date.now() - timelineStartTime : 0;
    addTimelineEvent("error", "连接失败", currentTime);
  }
};

// 重写模拟断开方法，添加日志和动画
const handleSimulateDisconnect = () => {
  simulateDisconnect();
  addLog("网络连接断开", "error");
  const currentTime = timelineStartTime ? Date.now() - timelineStartTime : 0;
  addTimelineEvent("disconnect", "网络断开", currentTime);

  // 开始重连动画
  isReconnecting.value = true;
  // 动画已经在运行，不需要重新开始
};

// 重写离开方法，添加日志和动画
const handleLeave = () => {
  leave();
  addLog("离开频道", "info");
  const currentTime = timelineStartTime ? Date.now() - timelineStartTime : 0;
  addTimelineEvent("leave", "离开频道", currentTime);
  isReconnecting.value = false;
  stopTimelineAnimation(); // 离开时停止动画
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 监听状态变化，添加日志和动画
watch(connectionState, (newState, oldState) => {
  if (newState !== oldState) {
    switch (newState) {
      case ConnectionState.CONNECTING:
        addLog("状态变化: 开始连接", "info");
        break;
      case ConnectionState.CONNECTED:
        addLog("状态变化: 连接成功", "success");
        if (oldState === ConnectionState.RECONNECTING) {
          const currentTime = timelineStartTime
            ? Date.now() - timelineStartTime
            : 0;
          console.log(`重连成功事件: 时间: ${currentTime}ms`);
          addTimelineEvent("success", "重连成功", currentTime);
        }
        isReconnecting.value = false;
        // 不停止动画，让动画继续运行
        break;
      case ConnectionState.DISCONNECTED:
        addLog("状态变化: 连接断开", "error");
        break;
      case ConnectionState.RECONNECTING:
        addLog("状态变化: 开始重连", "warning");
        isReconnecting.value = true;
        // 动画已经在运行，不需要重新开始
        break;
    }
  }
});

// 监听重连次数变化
watch(reconnectCount, (newCount, oldCount) => {
  if (newCount > oldCount) {
    addLog(`重连尝试: 第${newCount}次`, "warning");
    const currentTime = timelineStartTime ? Date.now() - timelineStartTime : 0;
    console.log(`添加重连事件: 第${newCount}次, 时间: ${currentTime}ms`);
    addTimelineEvent("reconnect", `重连 #${newCount}`, currentTime);
  }
});

// 监听总尝试次数变化
watch(totalAttempts, (newTotal, oldTotal) => {
  if (newTotal > oldTotal) {
    addLog(`总重连次数: ${newTotal}`, "info");
    console.log(`总重连次数更新: ${newTotal}`);

    // 检查是否达到最大重连次数
    if (newTotal >= maxReconnectAttempts.value) {
      const currentTime = timelineStartTime
        ? Date.now() - timelineStartTime
        : 0;
      console.log(`重连失败事件: 达到最大重连次数, 时间: ${currentTime}ms`);
      addTimelineEvent("error", "重连失败", currentTime);
    }
  }
});

onMounted(() => {
  addLog("重连演示系统就绪", "info");
});

onUnmounted(() => {
  stopTimelineAnimation();
});
</script>

<style scoped>
.reconnect-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.status-section,
.controls-section,
.log-section,
.settings-section,
.code-section,
.timeline-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.status-indicator {
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  margin: 10px 0;
}

.status-indicator.disconnected {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.status-indicator.connecting {
  background-color: #fff3e0;
  color: #ef6c00;
  border: 1px solid #ff9800;
}

.status-indicator.connected {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #4caf50;
}

.status-indicator.reconnecting {
  background-color: #fff3e0;
  color: #ef6c00;
  border: 1px solid #ff9800;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.connection-info {
  background-color: white;
  padding: 15px;
  border-radius: 5px;
  margin-top: 10px;
}

.connection-info p {
  margin: 5px 0;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.button-group button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.button-group button:not(:disabled) {
  background-color: #2196f3;
  color: white;
}

.button-group button:not(:disabled):hover {
  background-color: #1976d2;
}

.button-group button:disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

/* 时间轴样式 */
.timeline-container {
  height: 200px;
  overflow-x: auto;
  overflow-y: hidden;
}

.timeline {
  position: relative;
  height: 200px;
  min-width: 800px;
  width: max-content; /* 让宽度自适应内容 */
  background: linear-gradient(90deg, #f1f5f9 0%, #f8fafc 100%);
  border-radius: 8px;
  border: 1px solid #ddd;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: #f8fafc;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
}

.time-mark {
  position: absolute;
  font-size: 0.8rem;
  color: #64748b;
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

.event-item.connect {
  background: #3b82f6;
}

.event-item.disconnect {
  background: #ef4444;
}

.event-item.reconnect {
  background: #f59e0b;
}

.event-item.success {
  background: #10b981;
}

.event-item.error {
  background: #ef4444;
}

.event-item.leave {
  background: #8b5cf6;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
}

.log-item {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  font-family: "Courier New", monospace;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  margin-right: 10px;
}

.log-message {
  color: #333;
}

.log-item.info .log-message {
  color: #2196f3;
}

.log-item.success .log-message {
  color: #4caf50;
}

.log-item.error .log-message {
  color: #f44336;
}

.log-item.warning .log-message {
  color: #ff9800;
}

.clear-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.clear-btn:hover {
  background-color: #d32f2f;
}

.setting-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item label {
  min-width: 150px;
  font-weight: bold;
}

.setting-item input[type="number"] {
  width: 100px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.setting-item input[type="checkbox"] {
  margin-right: 5px;
}

.code-container {
  background-color: #1e1e1e;
  border-radius: 5px;
  padding: 15px;
  overflow-x: auto;
}

.code-container pre {
  margin: 0;
  color: #d4d4d4;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
}

.code-container code {
  color: #d4d4d4;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

h2 {
  color: #555;
  margin-bottom: 15px;
  border-bottom: 2px solid #2196f3;
  padding-bottom: 5px;
}
</style>
