import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import naive from 'naive-ui'
import App from './App.vue'
import RetryLogicDemo from './views/RetryLogicDemo.vue'
import OperatorsDemo from './views/OperatorsDemo.vue'
import StreamCombinationDemo from './views/StreamCombinationDemo.vue'
import ErrorHandlingDemo from './views/ErrorHandlingDemo.vue'
import './style.css'

const routes = [
  { path: '/', redirect: '/retry-logic' },
  { path: '/retry-logic', component: RetryLogicDemo, name: 'RetryLogic', meta: { title: '重试逻辑演示' } },
  { path: '/operators', component: OperatorsDemo, name: 'Operators', meta: { title: '操作符演示' } },
  { path: '/stream-combination', component: StreamCombinationDemo, name: 'StreamCombination', meta: { title: '流组合演示' } },
  { path: '/error-handling', component: ErrorHandlingDemo, name: 'ErrorHandling', meta: { title: '错误处理演示' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(naive)
app.mount('#app')
