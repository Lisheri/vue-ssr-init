import axios from 'axios'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
export const __dirname = dirname(fileURLToPath(import.meta.url))

export const writeElm = (version) => {
  return new Promise((resolve) => {
    axios.get(`https://unpkg.com/element-ui@${version}/lib/index.js`).then((res) => {
      fs.writeFile(path.resolve(__dirname, `./element@${version}.js`), res.data, () => {
        resolve('ok')
      })
    })
  })
}
