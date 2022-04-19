# macaca-puppeteer

---

[![NPM version][npm-image]][npm-url]
[![CI][CI-image]][CI-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]

[npm-image]: https://img.shields.io/npm/v/macaca-puppeteer.svg
[npm-url]: https://npmjs.org/package/macaca-puppeteer
[CI-image]: https://github.com/macacajs/macaca-puppeteer/actions/workflows/ci.yml/badge.svg
[CI-url]: https://github.com/macacajs/macaca-puppeteer/actions/workflows/ci.yml
[coveralls-image]: https://img.shields.io/coveralls/macacajs/macaca-puppeteer.svg
[coveralls-url]: https://coveralls.io/r/macacajs/macaca-puppeteer?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=_8-green.svg
[node-url]: http://nodejs.org/download/

> [Puppeteer](//github.com/GoogleChrome/puppeteer) is a Node library which provides a high-level API to control headless Chrome over the DevTools Protocol. It can also be configured to use full (non-headless) Chrome. Macaca Puppeteer is a long-term maintained browser driver as a candidate for Macaca Electron driver.

## Installment

```bash
$ npm i macaca-puppeteer -g
```

## Usage as module

```javascript
const fs = require('fs');
const path = require('path');
const Puppeteer = require('macaca-puppeteer');

const puppeteer = new Puppeteer();

async function() {
  /**
    default options
    {
      headless: false,
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      userAgent: 'userAgent string'
    }
  */
  await puppeteer.startDevice({
    headless: true // in silence
  });

  await puppeteer.maximize();
  await puppeteer.setWindowSize(null, 500, 500);
  await puppeteer.get('https://www.baidu.com');
  const imgData = await puppeteer.getScreenshot();
  const img = new Buffer(imgData, 'base64');
  const p = path.join(__dirname, '..', 'screenshot.png')
  fs.writeFileSync(p, img.toString('binary'), 'binary');
  console.log(`screenshot: ${p}`);

  await puppeteer.stopDevice();
};
```

- [sample](//github.com/macaca-sample/sample-nodejs)
- [More API](//macacajs.github.io/macaca-puppeteer/)

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="100px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/11460601?v=4" width="100px;"/><br/><sub><b>zivyangll</b></sub>](https://github.com/zivyangll)<br/>|
| :---: | :---: |


This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Fri Nov 19 2021 19:26:42 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->
