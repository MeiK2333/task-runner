import { T, R } from '../src'

import axios from 'axios';
import { promises } from 'fs';

(async () => {
  const urls = [
    'https://avatars3.githubusercontent.com/u/20951666',
    'https://avatars1.githubusercontent.com/u/19774268',
    'https://avatars0.githubusercontent.com/u/16873295',
    'https://avatars0.githubusercontent.com/u/25977768'
  ];
  const funcs = [];
  for (const url of urls) {
    funcs.push(T(async () => {
      console.log(`download ${url}`);
      const resp = await axios.get(url, { responseType: 'arraybuffer' });
      await promises.writeFile(url.split('/')[4] + '.jpg', resp.data);
      console.log(`success`);
    }))
  }
  await R(funcs, { maxRunning: 3 });
})();