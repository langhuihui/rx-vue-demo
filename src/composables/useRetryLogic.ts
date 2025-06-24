import {
  pipe,
  of,
  subject,
  filter,
  audit,
  switchMap,
  timeout,
  retry,
  take,
  subscribe,
  timer,
  TimeoutError
} from 'fastrx';

// 创建 mcTimeout 函数
function mcTimeout(duration: number) {
  return timer(duration);
}

interface SendReqOptions {
  timeout?: number;
  retries?: number;
  retryInterval?: number;
  serverDelay?: number;
  failureRate?: number;
  onAttempt?: (attempt: number, total: number, uuid: number) => void;
  onTimeout?: () => void;
}

interface Response {
  uuid: number;
  err: number;
  data: any;
}

export function useRetryLogic() {
  let reqSeq = 0;
  const resSubject = subject<Response>();

  const simulateSendData = (command: string, uuid: number, options: SendReqOptions) => {
    const { serverDelay = 2000, failureRate = 30 } = options;

    setTimeout(() => {
      // 根据失败率决定是否成功
      const shouldFail = Math.random() * 100 < failureRate;

      const response: Response = {
        uuid,
        err: shouldFail ? 1001 : 0,
        data: shouldFail
          ? { message: '模拟服务器错误' }
          : {
            message: '请求处理成功',
            timestamp: Date.now(),
            command: command
          }
      };

      resSubject.next(response);
    }, serverDelay);
  };

  const sendReq = (
    command: string,
    _data: any = {},
    options: SendReqOptions = {}
  ): Promise<Response> => {
    const {
      timeout: timeoutMs = 5000,
      retries = 3,
      retryInterval = 1000,
      onAttempt,
      onTimeout
    } = options;

    const uuid = ++reqSeq;

    return new Promise((resolve, reject) => {
      let attemptCount = 0;

      // 使用 FastRx 管道，类似原始代码
      pipe(
        of(0),
        audit(() => (attemptCount ? mcTimeout(retryInterval) : of(0))),
        switchMap(() => {
          attemptCount++;

          // 调用回调函数
          onAttempt?.(attemptCount, retries + 1, uuid);

          // 模拟发送数据
          simulateSendData(command, uuid, options);
          return resSubject;
        }),
        filter((res: Response) => res.uuid === uuid),
        timeout(timeoutMs),
        retry(retries),
        take(1),
        subscribe(
          (result: Response) => {
            if (result.err) {
              reject(result.data);
              return;
            }
            resolve(result);
          },
          (error: any) => {
            if (error instanceof TimeoutError) {
              onTimeout?.();
            }
            reject(error);
          }
        )
      );
    });
  };

  return {
    sendReq
  };
}
