// * 服务端打包配置
const { merge } = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const baseConfig = require('./webpack.base.config.js');
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');

module.exports = merge(baseConfig, {
  // 将 entry 指向应用程序的 server entry 文件
  entry: './src/entry-server.js',
  // 允许webpack 以 node 适用方式处理模块加载
  // 并且还会再编译Vue组件时, 告知 vue-loader 输送面向服务器代码(server-oriented code)
  target: 'node',
  output: {
    filename: 'server-bundle.js',
    // 此处告知 server bundle 使用 Node风格导出模块(Node-style exports)
    libraryTarget: 'commonjs2'
  },
  // 不打包 node_modules第三方包, 而保留 require 方式直接加载
  externals: [nodeExternals({
    // 白名单中的资源依然正常打包
    allowlist: [/\.css$/]
  })],
  plugins: [
    // 这是将服务器的整个数据构建为单个JSON文件的插件
    // 默认文件名为 'vue-ssr-server-bundle.json'
    new VueSSRServerPlugin()
  ]
})
