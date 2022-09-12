const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');

module.exports = merge(baseConfig, {
  entry: {
    // 相对路径是node执行的路径
    app: './src/entry-client.js'
  },
  module: {
    rules: [
      // ES6 -> ES5
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true,
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  },
  // 将webpack运行时分离到一个引导 chunk 中, 以便可以在之后正确注入异步 chunk
  optimization: {
    splitChunks: {
      name: 'manifest',
      minChunks: Infinity
    }
  },
  plugins: [
    // 此插件在输出目录中生成 'vue-ssr-client-manifest.json', 这个文件中描述了客户端打包的结果、依赖以及需要加载的模块信息
    new VueSSRClientPlugin()
  ]
})