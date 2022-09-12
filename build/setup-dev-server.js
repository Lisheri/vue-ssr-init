const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const webpack = require('webpack');

const resolve = pathStr => path.resolve(__dirname, pathStr);

// * 可以通过 自定义文件系统(Custom File Systems) 将文件写入内存中, 避免开发环境频繁的磁盘操作, webpack推荐使用第三方包memfs
// * 当然这种方式有些麻烦, 可以使用另一种方式, 也就是webpack官方提供的 webpack-dev-middleware, 可以默认将打包结果输出到内存中
const devMiddleware = require('webpack-dev-middleware');

// setupDevServer本身
module.exports = (server, cb) => {
  let ready;

  const onReady = new Promise(r => ready = r);
  // 监视构建 -> 更新 renderer
  let template;
  let serverBundle;
  let clientManifest;

  // 更新函数
  const updated = () => {
    if (template && serverBundle && clientManifest) {
      // cb调用意味着开发环境的构建已经完成
      ready(); // ready执行意味着promise执行完成, 也就可以继续往下执行render方法响应最新的构建结果
      cb(serverBundle, template, clientManifest);
    }
  };
  // 监视构建 template -> 调用 update -> 更新renderer渲染器
  const templatePath = resolve('../index.template.html');
  template = fs.readFileSync(templatePath, 'utf-8');
  // fs.watch, fs.watchFile可以监视, 但是这里主要使用chokidar包, 其实也是基于 fs.watch 或者 fs.watchFile封装的
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8');
    updated();
  });

  // 监视构建 serverBundle -> 调用 update -> 更新renderer渲染器
  const serverConfig = require('./webpack.server.config');
  // 获取到webpack创建的一个编译器, 用于编译server
  const serverCompiler = webpack(serverConfig);
  // serverDevMiddleware 是一个用于操作 devMiddleware创建的文件的对象, 如果使用fs模块, 操作内存文件会较为麻烦
  const { context: serverContext } = devMiddleware(serverCompiler, {
    // logLevel: 'silent' // 关闭日志输出, 由 FriendlyErrorsWebpackPlugin 统一管理日志输出
  });
  // 使用done钩子, 每一次编译结束会执行(其实就是使用插件了)
  serverCompiler.hooks.done.tap('server', () => {
    // 不能直接用require加载, 因为require加载文件有缓存, 即便是文件有变动, 也不会加载新的内容了, 此处读取字符串在转json
    serverBundle = JSON.parse(serverContext.outputFileSystem.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8'));
    updated();
    console.info('server compiler success');
  });

  // 监视构建 clientManifest -> 调用 update -> 更新renderer渲染器(和server一样处理即可)
  const clientConfig = require('./webpack.client.config');
  const clientCompiler = webpack(clientConfig);
  const clientDevMiddleware = devMiddleware(clientCompiler, {
    publicPath: clientConfig.output.publicPath
    // logLevel: 'silent' // 关闭日志输出, 由 FriendlyErrorsWebpackPlugin 统一管理日志输出
  });
  clientCompiler.hooks.done.tap('client', () => {
    clientManifest = JSON.parse(clientDevMiddleware.context.outputFileSystem.readFileSync(resolve('../dist/vue-ssr-client-manifest.json'), 'utf-8'));
    updated();
    console.info('server compiler success');
  });

  // 将clientDevMiddleware 挂在到 express 服务中, 提供对其内部内存数据的访问, 否则访问不到
  server.use(clientDevMiddleware)
  return onReady;
};




// TODO 废弃代码

// 使用 devMiddleware 以后, 就不必使用watch监视文件变化了~
/*
  调用watch方法, 就会直接执行打包构建, 同时监视资源变化, 资源发生变化后重新执行打包构建
  serverCompiler.watch({}, (err, states) => {
    if (err) {
      // webpack配置文件错误, 直接抛错中断运行
      throw err;
    }
    // hasErrors获取打包构建后的结果是否有错, 也就是源码是否有错
    if (states.hasErrors()) {
      // 有错不必要继续执行
      return;
    }
    // 不能直接用require加载, 因为require加载文件有缓存, 即便是文件有变动, 也不会加载新的内容了, 此处读取字符串在转json
    serverBundle = JSON.parse(fs.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8'));
    updated();
    console.info('server compiler success');
  }); 
*/

// const clientConfig = require('./webpack.client.config');
  // const clientCompiler = webpack(clientConfig);
  // clientCompiler.watch({}, (err, states) => {
  //   if (err) {
  //     // webpack配置文件错误, 直接抛错中断运行
  //     throw err;
  //   }
  //   // hasErrors获取打包构建后的结果是否有错, 也就是源码是否有错
  //   if (states.hasErrors()) {
  //     // 有错不必要继续执行
  //     return;
  //   }
  //   // 不能直接用require加载, 因为require加载文件有缓存, 即便是文件有变动, 也不会加载新的内容了, 此处读取字符串在转json
  //   clientManifest = JSON.parse(fs.readFileSync(resolve('../dist/vue-ssr-client-manifest.json'), 'utf-8'));
  //   updated();
  //   console.info('client compiler success');
  // })
