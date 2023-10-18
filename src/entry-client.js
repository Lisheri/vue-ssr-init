// * 客户端入口
import { createApp } from "./app";
import ElementUI from 'element-ui';
const { app } = createApp(ElementUI);

// * 挂载
app.$mount("#app");
