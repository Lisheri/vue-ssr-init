// * 同构应用通用启动入口

// cross-env: 通过npm scripts 设置跨平台环境变量
import Vue from 'vue';
import App from './App.vue';
// import ElementUI from 'element-ui';

export function createApp(elm = {}) {
  const app = new Vue({
    render: h => h(App)
  })
  console.info(elm?.version, '1');
  Vue.use(elm);
  return { app };
}
