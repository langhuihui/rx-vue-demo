import { ref, reactive, onUnmounted } from 'vue';
import { expand, pipe, subscribe, switchMapTo, take, takeUntil, tap, switchMap, timer, subject } from 'fastrx';

// 连接状态枚举
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

// 重连管理器接口
export interface ReconnectManager {
  init(): Promise<void>;
  destroy(): void;
  getConnectionState(): ConnectionState;
  getReconnectCount(): number;
  getTotalAttempts(): number;
  getLastReconnectTime(): string | null;
}

// 信号通道接口（模拟TRTC的信号通道）
export interface SignalChannel {
  connection: any; // 模拟原始代码中的connection对象
  connOB: any;
  leaveOB: any;
  reconnect(): Promise<void>;
  disconnect(): void;
  leave(): void; // 添加leave方法
}

// 创建 mcTimeout 函数，模拟原始代码
function mcTimeout(duration: number) {
  return timer(duration);
}

// 重连管理器实现
export class ReconnectManagerImpl implements ReconnectManager {
  private signalChannel: SignalChannel;
  private connectionState = ref<ConnectionState>(ConnectionState.DISCONNECTED);
  private reconnectCount = ref(0);
  private totalAttempts = ref(0);
  private lastReconnectTime = ref<string | null>(null);
  private subscription: any = null;
  private reconnectInterval = 2000;
  private maxReconnectAttempts = 5;

  constructor(signalChannel: SignalChannel) {
    this.signalChannel = signalChannel;
  }

  async init() {
    // 重连尝试的 Observable - 严格按照原始代码形式
    const reconnectOB = (sink: any) => this.signalChannel.reconnect().then(
      () => {
        this.connectionState.value = ConnectionState.CONNECTED;
        this.lastReconnectTime.value = new Date().toLocaleTimeString();
        sink.complete();
      },
      err => {
        this.reconnectCount.value++;
        this.totalAttempts.value++;
        this.connectionState.value = ConnectionState.RECONNECTING;
        sink.next(err);
      }
    );

    // 严格按照原始代码的管道结构
    this.subscription = pipe(
      this.signalChannel.connOB, // Start when connection is established
      tap(() => {
        // 连接建立后立即设置状态
        this.connectionState.value = ConnectionState.CONNECTED;
      }),
      switchMap(() => pipe( // Switch to a new observable when disconnected
        this.signalChannel.connection.disconnectSubject, // 使用subject替代fromEvent
        tap(() => {
          console.log('disconnect');
          this.connectionState.value = ConnectionState.DISCONNECTED;
        }), // When disconnected, start with retry count 0
        expand((): any => pipe(
          mcTimeout(this.reconnectInterval), // Wait based on retry count
          switchMapTo(reconnectOB) // Attempt reconnection
        )),
        take(this.maxReconnectAttempts + 1) // Limit retry attempts
      )),
      takeUntil(this.signalChannel.leaveOB), // Stop if channel is reinitialized
      subscribe() // Execute the observable
    );
  }

  destroy() {
    if (this.subscription) {
      this.subscription.dispose();
      this.subscription = null;
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState.value;
  }

  getReconnectCount(): number {
    return this.reconnectCount.value;
  }

  getTotalAttempts(): number {
    return this.totalAttempts.value;
  }

  getLastReconnectTime(): string | null {
    return this.lastReconnectTime.value;
  }

  // 设置重连参数
  setReconnectInterval(interval: number) {
    this.reconnectInterval = interval;
  }

  setMaxReconnectAttempts(attempts: number) {
    this.maxReconnectAttempts = attempts;
  }

  // 重置重连计数
  resetReconnectCount() {
    this.reconnectCount.value = 0;
  }
}

// 创建模拟的信号通道
export function createMockSignalChannel(): SignalChannel {
  // 创建断开连接的subject
  const disconnectSubject = subject<ConnectionState>();
  // 创建离开频道的subject
  const leaveSubject = subject<void>();

  // 创建一个可以发送事件的connection对象
  const connection = reactive({
    state: ConnectionState.DISCONNECTED,
    disconnectSubject, // 用于发送断开事件
    // 添加事件发射器功能
    emit: (event: string, data?: any) => {
      // 模拟事件发射
      if (event === ConnectionState.DISCONNECTED) {
        connection.state = ConnectionState.DISCONNECTED;
        disconnectSubject.next(ConnectionState.DISCONNECTED);
      }
    }
  });

  const connOB = pipe(
    timer(1000), // 模拟连接建立延迟
    tap(() => {
      connection.state = ConnectionState.CONNECTED;
      // 确保连接成功后立即更新状态
      setTimeout(() => {
        connection.emit('connected');
      }, 100);
    })
  );

  const leaveOB = leaveSubject; // 直接使用subject，由界面按钮触发

  return {
    connection,
    connOB,
    leaveOB,
    async reconnect() {
      return new Promise((resolve, reject) => {
        // 模拟重连过程，30%成功率
        const success = Math.random() < 0.3;
        setTimeout(() => {
          if (success) {
            connection.state = ConnectionState.CONNECTED;
            resolve();
          } else {
            connection.state = ConnectionState.DISCONNECTED;
            reject(new Error('重连失败'));
          }
        }, 1000);
      });
    },
    disconnect() {
      // signalChannel的disconnect只管理自己的状态，不触发connection事件
      // connection.state = ConnectionState.DISCONNECTED;
      // connection.emit(ConnectionState.DISCONNECTED);
    },
    leave() {
      // 触发离开频道事件，停止重连逻辑
      // connection.state = ConnectionState.DISCONNECTED;
      leaveSubject.next();
    }
  };
}

// Vue组合式函数
export function useReconnectLogic() {
  const signalChannel = createMockSignalChannel();
  const reconnectManager = new ReconnectManagerImpl(signalChannel);

  const connectionState = ref<ConnectionState>(ConnectionState.DISCONNECTED);
  const reconnectCount = ref(0);
  const totalAttempts = ref(0);
  const lastReconnectTime = ref<string | null>(null);
  const isConnected = ref(false);

  // 监听状态变化
  const updateState = () => {
    connectionState.value = reconnectManager.getConnectionState();
    reconnectCount.value = reconnectManager.getReconnectCount();
    totalAttempts.value = reconnectManager.getTotalAttempts();
    lastReconnectTime.value = reconnectManager.getLastReconnectTime();
    isConnected.value = connectionState.value === ConnectionState.CONNECTED;
  };

  // 添加定时器来定期更新状态
  let stateUpdateTimer: number | null = null;

  const startStateUpdateTimer = () => {
    if (stateUpdateTimer) {
      clearInterval(stateUpdateTimer);
    }
    stateUpdateTimer = setInterval(updateState, 100); // 每100ms更新一次状态
  };

  const stopStateUpdateTimer = () => {
    if (stateUpdateTimer) {
      clearInterval(stateUpdateTimer);
      stateUpdateTimer = null;
    }
  };

  // 初始化重连管理器
  const initReconnectManager = async () => {
    await reconnectManager.init();
    updateState();
    startStateUpdateTimer(); // 开始状态更新定时器
  };

  // 销毁重连管理器
  const destroyReconnectManager = () => {
    reconnectManager.destroy();
    stopStateUpdateTimer(); // 停止状态更新定时器
  };

  // 模拟连接
  const connect = async () => {
    connectionState.value = ConnectionState.CONNECTING;
    isConnected.value = false;
    await initReconnectManager();

    // 等待连接建立
    await new Promise(resolve => {
      const checkConnection = () => {
        if (reconnectManager.getConnectionState() === ConnectionState.CONNECTED) {
          updateState();
          resolve(true);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  };

  // 模拟网络断开
  const simulateDisconnect = () => {
    // 直接触发connection的断开事件，不调用signalChannel.disconnect()
    signalChannel.connection.emit(ConnectionState.DISCONNECTED);
    connectionState.value = ConnectionState.DISCONNECTED;
    isConnected.value = false;
    updateState();
  };

  // 离开频道
  const leave = () => {
    signalChannel.leave(); // 触发leaveOB，停止重连逻辑
    destroyReconnectManager();
    connectionState.value = ConnectionState.DISCONNECTED;
    isConnected.value = false;
    // 同时更新connection状态
    signalChannel.connection.state = ConnectionState.DISCONNECTED;
  };

  // 组件卸载时清理
  onUnmounted(() => {
    destroyReconnectManager();
  });

  return {
    connectionState,
    reconnectCount,
    totalAttempts,
    lastReconnectTime,
    isConnected,
    connect,
    simulateDisconnect,
    leave,
    reconnectManager
  };
} 