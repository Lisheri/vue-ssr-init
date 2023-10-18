<template>
  <div id="app">
    <h1>{{ message }}</h1>
    <h2>客户端动态交互</h2>
    <div>
      <input v-model="message" />
    </div>
    <el-button @click="onClick">测试点击</el-button>
    <el-divider></el-divider>
    <a-aaa>111</a-aaa>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
export default defineComponent({
  setup() {
    const message = ref('测试message');
    const onClick = () => {
      console.info('点击')
    }
    return {
      message,
      onClick
    }
  }
})
</script>
<style lang="scss" scoped></style>
