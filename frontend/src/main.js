import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import './styles/global.css'
import './assets/css/responsive.css'
import notificationService from './services/notificationService';

const app = createApp(App)

app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 初始化并启动WebSocket通知服务
notificationService.initialize();

app.mount('#app')
