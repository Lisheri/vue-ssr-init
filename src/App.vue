<template>
  <div id="app">
    <h1>{{ message }}</h1>
    <h2>客户端动态交互</h2>
    <div>
      <input v-model="message" />
    </div>
    <button @click="onClick">测试点击</button>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
export default defineComponent({
  setup() {
    console.info('fuck')
    const message = ref('日你的吗');
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
