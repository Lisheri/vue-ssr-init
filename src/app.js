// * 同构应用通用启动入口

// cross-env: 通过npm scripts 设置跨平台环境变量
import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';

export function createApp() {
  console.info(ElementUI.version)
  const app = new Vue({
    render: h => h(App)
  })
  Vue.use(ElementUI);
  return { app };
}
