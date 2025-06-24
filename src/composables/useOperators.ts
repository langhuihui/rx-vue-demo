import {
  pipe,
  of,
  subject,
  map,
  filter,
  take,
  debounceTime,
  scan,
  switchMap,
  timer,
  subscribe
} from 'fastrx'

export function useOperators() {
  let inputSubject = subject<number>()
  let subscription: any = null

  const runOperator = (operatorName: string, param: number, onOutput: (value: any) => void) => {
    // 重新创建输入主题
    inputSubject = subject<number>()
    
    let operatorStream
    
    switch (operatorName) {
      case 'map':
        operatorStream = pipe(
          inputSubject,
          map((x: number) => x * param),
          subscribe(onOutput)
        )
        break
        
      case 'filter':
        operatorStream = pipe(
          inputSubject,
          filter((x: number) => x % param === 0),
          subscribe(onOutput)
        )
        break
        
      case 'take':
        operatorStream = pipe(
          inputSubject,
          take(param),
          subscribe(onOutput)
        )
        break
        
      case 'debounceTime':
        operatorStream = pipe(
          inputSubject,
          debounceTime(param * 500),
          subscribe(onOutput)
        )
        break
        
      case 'scan':
        operatorStream = pipe(
          inputSubject,
          scan((acc: number, val: number) => acc + val, 0),
          subscribe(onOutput)
        )
        break
        
      case 'switchMap':
        operatorStream = pipe(
          inputSubject,
          switchMap((x: number) => timer(param * 100)),
          subscribe(() => onOutput('timer'))
        )
        break
        
      default:
        operatorStream = pipe(
          inputSubject,
          subscribe(onOutput)
        )
    }
    
    subscription = operatorStream
  }

  const stopOperator = () => {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe()
    }
  }

  const sendInput = (value: number) => {
    inputSubject.next(value)
  }

  return {
    runOperator,
    stopOperator,
    sendInput
  }
}
