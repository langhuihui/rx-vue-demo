import {
  pipe,
  of,
  subject,
  timer,
  map,
  subscribe
} from 'fastrx'

interface CombinationCallbacks {
  onStreamA: (value: any) => void
  onStreamB: (value: any) => void
  onResult: (value: any, description: string) => void
}

export function useStreamCombination() {
  let streamASubject = subject<number>()
  let streamBSubject = subject<number>()
  let intervalA: number | null = null
  let intervalB: number | null = null
  let subscription: any = null

  const startCombination = (
    type: string,
    intervalAMs: number,
    intervalBMs: number,
    callbacks: CombinationCallbacks
  ) => {
    // 重新创建主题
    streamASubject = subject<number>()
    streamBSubject = subject<number>()
    
    let counterA = 0
    let counterB = 0

    // 启动流A
    intervalA = setInterval(() => {
      const value = ++counterA
      streamASubject.next(value)
      callbacks.onStreamA(value)
    }, intervalAMs)

    // 启动流B
    intervalB = setInterval(() => {
      const value = ++counterB
      streamBSubject.next(value)
      callbacks.onStreamB(value)
    }, intervalBMs)

    // 根据类型设置组合操作
    switch (type) {
      case 'merge':
        // 简化的 merge 实现
        pipe(
          streamASubject,
          map((x: number) => `A${x}`),
          subscribe((value: string) => callbacks.onResult(value, 'merge from A'))
        )
        pipe(
          streamBSubject,
          map((x: number) => `B${x}`),
          subscribe((value: string) => callbacks.onResult(value, 'merge from B'))
        )
        break

      case 'zip':
        // 简化的 zip 实现
        let lastA: number | null = null
        let lastB: number | null = null
        
        pipe(
          streamASubject,
          subscribe((a: number) => {
            lastA = a
            if (lastB !== null) {
              callbacks.onResult(`[A${lastA}, B${lastB}]`, 'zip combination')
              lastA = null
              lastB = null
            }
          })
        )
        
        pipe(
          streamBSubject,
          subscribe((b: number) => {
            lastB = b
            if (lastA !== null) {
              callbacks.onResult(`[A${lastA}, B${lastB}]`, 'zip combination')
              lastA = null
              lastB = null
            }
          })
        )
        break

      case 'combineLatest':
        // 简化的 combineLatest 实现
        let latestA: number | null = null
        let latestB: number | null = null
        
        pipe(
          streamASubject,
          subscribe((a: number) => {
            latestA = a
            if (latestB !== null) {
              callbacks.onResult(`[A${latestA}, B${latestB}]`, 'combineLatest')
            }
          })
        )
        
        pipe(
          streamBSubject,
          subscribe((b: number) => {
            latestB = b
            if (latestA !== null) {
              callbacks.onResult(`[A${latestA}, B${latestB}]`, 'combineLatest')
            }
          })
        )
        break

      default:
        // 默认行为
        pipe(
          streamASubject,
          subscribe((value: number) => callbacks.onResult(`A${value}`, 'from A'))
        )
        pipe(
          streamBSubject,
          subscribe((value: number) => callbacks.onResult(`B${value}`, 'from B'))
        )
    }
  }

  const stopCombination = () => {
    if (intervalA) {
      clearInterval(intervalA)
      intervalA = null
    }
    if (intervalB) {
      clearInterval(intervalB)
      intervalB = null
    }
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe()
    }
  }

  return {
    startCombination,
    stopCombination
  }
}
