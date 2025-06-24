import {
  pipe,
  of,
  subject,
  map,
  catchError,
  retry,
  subscribe,
  timer
} from 'fastrx'

interface ErrorHandlingOptions {
  errorRate: number
  retryCount: number
  dataInterval: number
}

interface ErrorHandlingCallbacks {
  onData: (value: any) => void
  onSuccess: (value: any) => void
  onError: (error: any) => void
  onRetry: (attempt: number) => void
  onRecover: (value: any) => void
}

export function useErrorHandling() {
  let dataSubject = subject<number>()
  let interval: number | null = null
  let subscription: any = null

  const startErrorHandling = (
    type: string,
    options: ErrorHandlingOptions,
    callbacks: ErrorHandlingCallbacks
  ) => {
    dataSubject = subject<number>()
    let counter = 0

    // 启动数据生成
    interval = setInterval(() => {
      const value = ++counter
      callbacks.onData(value)
      dataSubject.next(value)
    }, options.dataInterval)

    // 根据类型设置错误处理
    switch (type) {
      case 'catchError':
        subscription = pipe(
          dataSubject,
          map((x: number) => {
            if (Math.random() * 100 < options.errorRate) {
              throw new Error(`处理错误: 数据 ${x}`)
            }
            return x * 2
          }),
          catchError((error: any) => {
            callbacks.onError(error)
            callbacks.onRecover('默认值')
            return of('默认值')
          }),
          subscribe((value: any) => {
            callbacks.onSuccess(value)
          })
        )
        break

      case 'retry':
        let retryAttempt = 0
        subscription = pipe(
          dataSubject,
          map((x: number) => {
            if (Math.random() * 100 < options.errorRate) {
              retryAttempt++
              callbacks.onRetry(retryAttempt)
              throw new Error(`处理错误: 数据 ${x}`)
            }
            retryAttempt = 0
            return x * 2
          }),
          retry(options.retryCount),
          subscribe(
            (value: any) => {
              callbacks.onSuccess(value)
            },
            (error: any) => {
              callbacks.onError(error)
            }
          )
        )
        break

      case 'finalize':
        subscription = pipe(
          dataSubject,
          map((x: number) => {
            if (Math.random() * 100 < options.errorRate) {
              throw new Error(`处理错误: 数据 ${x}`)
            }
            return x * 2
          }),
          subscribe(
            (value: any) => {
              callbacks.onSuccess(value)
            },
            (error: any) => {
              callbacks.onError(error)
              // 模拟 finalize
              callbacks.onRecover('清理资源')
            }
          )
        )
        break

      default:
        subscription = pipe(
          dataSubject,
          map((x: number) => {
            if (Math.random() * 100 < options.errorRate) {
              throw new Error(`处理错误: 数据 ${x}`)
            }
            return x * 2
          }),
          subscribe(
            (value: any) => {
              callbacks.onSuccess(value)
            },
            (error: any) => {
              callbacks.onError(error)
            }
          )
        )
    }
  }

  const stopErrorHandling = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe()
    }
  }

  return {
    startErrorHandling,
    stopErrorHandling
  }
}
