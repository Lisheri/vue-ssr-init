import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from "url";
export const __dirname = dirname(fileURLToPath(import.meta.url));

export const whiteElm = async (version) => {
  const element = await (await axios.get(`https://unpkg.com/element-ui@${version}/lib/index.js`)).data;
  console.info(__dirname)
  fs.writeFileSync(path.resolve(__dirname, './element.js'), element, 'utf-8');
}
