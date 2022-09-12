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
  `app.$mount('#app');`

  由于服务器已经渲染好了HTML, 所以无需将其丢弃再重新创建所有的DOM元素, 相反, 需要"激活"这些静态的HTML(这个过程也有一个专业术语, 叫做 template注水操作), 然后使他们成为动态的(能够响应后续的数据变化)

  操作结束后, 检查服务端的输出结果, 会注意到应用程序的根元素上添加了一个特殊的属性: 'data-server-renderer="true"'
  这个属性也就是让客户端Vue知道这部分HTML是由Vue在服务端渲染的, 并且应该以激活模式进行挂载。

  在没有 data-server-renderer属性的元素上, 还可以向 $mount函数的 hydrating 参数位置传入 true, 来强制使用激活模式(hydration)

  `app.$mount('#app', true)`

  开发模式下, Vue降推断客户端生成的虚拟DOM树(virtual DOM tree), 是否与从服务端渲染的DOM结构(DOM structure)匹配, 如果无法匹配, 
  将推出混合模式, 丢弃现有的DOM结构并从头开始渲染。在生产模式下, 此检测会被跳过, 以避免不必要的性能损耗(开发人员应该已知是否匹配再上生产环境)

  注:
  浏览器可能会更改一些特殊的HTML结构。例如在Vue模板中写入:
  ```html
  <table>
    <tr><td>hi</td></tr>
  </table>
  ```

  浏览器会在table内部自动注入tbody, 然而由于Vue生成的虚拟DOM(virtual DOM)不包含tbody, 所以会导致无法匹配。为能够正确匹配, 请确保在模板中写入有效的HTML