// * 公共配置
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const path = require('path');
// 提供打包日志
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const resolve = file => path.resolve(__dirname, file)

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  mode: isProd ? 'production' : 'development',
  output: {
    path: resolve('../dist/'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js'
  },
  resolve: {
    alias: {
      '@': resolve('../src/')
    },
    extensions: ['.js', '.vue', '.json', '.jsx']
  },
  devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
  module: {
    rules: [
      // 图片
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      },
      // 处理字体资源
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
      // 处理vue
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      // 处理css,以及.vue中的style 模块
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      // css预处理器
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new FriendlyErrorsWebpackPlugin()
  ]
}
