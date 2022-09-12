const Vue = require('vue');
const express = require('express');
const fs = require('fs');
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server');

const server = express();

// 开发dist目录, 挂载一个处理静态资源的中间件
// 这个表示当请求到以/dist开头的资源时, 会使用express.static中间件去查找dist中的资源并返回
// express.static处理的是物理磁盘中的资源文件, 而webpack-dev-middleware将结果打包到了内存中
server.use('/dist', express.static('./dist'));

const isProd = process.env.NODE_ENV === '';
let renderer;
let onReady;
if (isProd) {
  // 服务端
  const serverBundle = require('./dist/vue-ssr-server-bundle.json');
  // 客户端
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');
  const template = fs.readFileSync('./index.template.html', 'utf-8');
  // 在服务端渲染Vue
  renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest
  });
} else {
  // 开发环境 -> 监听源码改动, 自动打包构建 -> 重新生成 renderer 渲染器

  // ? setupDevServer 用于设置开发模式的服务, 需要获取到server实例, 主要需要给web服务挂载一些中间件
  // ? 第二个参数是一个回调函数, 当监视到打包构建, 回调函数就会执行, 在其中需要重新生成renderer渲染器
  // ? 并且 setupDevServer 返回值是应该是一个 Promise, 可以控制函数执行并且在外部可以拿到Promise返回的状态
  // 为了重生生成renderer渲染器, 所以需要传入三个资源, 也就是 serverBundle template 以及 clientManifest
  onReady = setupDevServer(server, (serverBundle, template, clientManifest) => {
    // 基于新的结果重新生成renderer
    renderer = createBundleRenderer(serverBundle, {
      template,
      clientManifest
    });
  })
}

/* 
  + SSR 只是将这种纯静态的渲染成HTML发布给客户端, 但是它本身并不会提供和客户端交互的功能
  + 同构渲染的大致流程主要如下: 
    - Source(源代码)经过webpack build构建成一个包含Node Server和Browser两个部分的同构应用
    - Source中主要包含了 Server entry(服务端入口), 目前为止只有这个, 主要处理服务端渲染
    - 如果需要和客户端交互的能力, 还需要一个客户端入口 Client entry, 专门用于接管SSR, 将其激活成一个动态页面
    - 通过webpack打包构建后：
        * 将 Server entry  -> Server Bundle 做SSR
        * 将 Client entry -> Client Bundle 接管SSR, 对其进行激活, 做动态的客户端交互
  + 以上就是同构应用的基本流程
*/

// 路由处理渲染函数
const render = (req, res) => {
  // 此处无需创建实例, 会找到entry-server, 然后调用其中的方法得到vue实例, 再来渲染, renderer会自动完成这个事情
  renderer.renderToString({
    // 设置页面标题
    title: 'fuck you',
    meta: `
      <meta name="description" content="fuck" >
    `
  }, (err, html) => {
    if (err) {
      // 服务端报错
      res.status(500).end('Internal Server Error.');
    }
    // 设置响应头的编码格式, 防止乱码
    res.setHeader('Content-Type', 'text/html; charset=utf8');
    res.end(html);
  });
}

const devRender = (req, res) => {
  // 等待重新生成 renderer 渲染器以后, 调用 render进行渲染
  onReady.then(() => {
    render(req, res);
  });
}

server.get('/', isProd ? render : devRender);

server.listen(3000, () => {
  console.info('Server running at 3000');
});


/* 
  解析渲染流程:
  + 1. 服务端渲染是如何输出html内容
  + 2. 客户端渲染是如何接管并激活

  * 服务端输出html内容:

  当客户端请求进来之后, 被服务端路由/匹配到, 调用 renderer渲染器的 renderToString 方法进行渲染

  renderToString 会将Vue实例渲染为HTML字符串然后发送给客户端

  renderer对象是通过createBundleRenderer方法创建的, createBundleRenderer 的第一个参数是serverBundle, 也就是服务端打包的结果

  serverBundle内部描述了服务端打包的信息, 主要有：

  + entry: 服务端打包的入口, 也就是服务端打包的时候配置的一个文件名
    - 这个文件就在files中
  + files: 内部包含了服务端打包的结果文件 server-bundle.js文件
  + maps: 包含了 server-bundle.js中的一些source-map信息, 主要用于开发调试

  renderer 渲染的时候, 会加载 serverBundle中的入口, 也就是server-bundle.js, 也就是在entry-server中创建的vue实例, 然后去渲染这个vue实例
  然后将渲染结果, 注入到template模板中, 最后发送给客户端

  * 客户端激活:

  在html的template中, 其实是没有定义需要引入的js文件的, 但是最终渲染的成品, 是包含这个引入的文件的
  主要还是定位到 createBundleRenderer, 我们传入了一个 clientManifest, 他是客户端打包资源的一个构建清单

  + publicPath:
    - 在这个清单中, 描述了客户端构建资源相关的信息, 比如说客户端资源打包出来的publicPath, 对应的就是webpack打包器中配置的publicPath
  + all:
    - 还有一个all文件, 对应的就是所有构建出来的资源文件的名称, 其中就有app.js, 以及app.js的sourcemap文件
  + initial:
    - app.js, renderer在渲染的时候, 会自动将initial中的资源, 自动的注入到模板模板页面的"vue-ssr-outlet"之后, 也就是在他后面自动注入script标签去加载js脚本
  + async:
    - 存储异步资源的信息
  + modules:
    - 针对原始模块做的依赖信息说明, 主要通过标识的方式来做的(也就是hash值), 键名是模块的hash, 键值数组中包含了他需要的索引资源文件(all字段对应的文件)的index
    - Vue会根据这个信息, 在对应的模块中去加载index值对应的all种的js文件

  ? 所谓的客户端激活, 就是指Vue在浏览器端接管由服务端发送的静态HTML, 使其变为由Vue管理的动态DOM的过程

  在 entry-client.js中, 使用如下代码挂载(mount)应用程序:(假设根元素的id为app)
  app.$mount('#app');

  由于服务器已经渲染好了HTML, 所以无需将其丢弃再重新创建所有的DOM元素, 相反, 需要"激活"这些静态的HTML(这个过程也有一个专业术语, 叫做 template注水操作), 然后使他们成为动态的(能够响应后续的数据变化)

  操作结束后, 检查服务端的输出结果, 会注意到应用程序的根元素上添加了一个特殊的属性: 'data-server-renderer="true"'
  这个属性也就是让客户端Vue知道这部分HTML是由Vue在服务端渲染的, 并且应该以激活模式进行挂载。

  在没有 data-server-renderer属性的元素上, 还可以向 $mount函数的 hydrating 参数位置传入 true, 来强制使用激活模式(hydration)

  app.$mount('#app', true)

  开发模式下, Vue降推断客户端生成的虚拟DOM树(virtual DOM tree), 是否与从服务端渲染的DOM结构(DOM structure)匹配, 如果无法匹配, 
  将推出混合模式, 丢弃现有的DOM结构并从头开始渲染。在生产模式下, 此检测会被跳过, 以避免不必要的性能损耗(开发人员应该已知是否匹配再上生产环境)

  注:
  浏览器可能会更改一些特殊的HTML结构。例如在Vue模板中写入:
  <table>
    <tr><td>hi</td></tr>
  </table>

  浏览器会在table内部自动注入tbody, 然而由于Vue生成的虚拟DOM(virtual DOM)不包含tbody, 所以会导致无法匹配。为能够正确匹配, 请确保在模板中写入有效的HTML
*/

