// * 服务端启动入口
import { createApp } from './app'
import path from 'path'
import fs from 'fs'
import { whiteElm, __dirname } from './loadElm'

const getElmSync = () => {
  return new Promise(resolve => {
    setImmediate(async () => {
      try {
        const elm = require('./element')
        resolve(elm);
      } catch(e) {
        console.info(e)
      }
    })
  })
}

const getElm = async (version) => {
  const stats = await fs.existsSync(path.resolve(__dirname, './element.js'))
  if (stats) {
    return await getElmSync();
  } else {
    await whiteElm(version)
    return await getElm(version)
  }
}
export default async (context) => {
  const elm = await getElm(context.version || '2.15.14')
  const { app } = createApp(elm)
  // 服务端路由处理、数据预取等...
  return app
}
