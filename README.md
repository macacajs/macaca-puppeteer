# macaca-puppeteer

[![Gitter Chat][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]

[gitter-image]: https://img.shields.io/badge/GITTER-join%20chat-green.svg?style=flat-square
[gitter-url]: https://gitter.im/alibaba/macaca
[npm-image]: https://img.shields.io/npm/v/macaca-puppeteer.svg?style=flat-square
[npm-url]: https://npmjs.org/package/macaca-puppeteer
[travis-image]: https://img.shields.io/travis/macacajs/macaca-puppeteer.svg?style=flat-square
[travis-url]: https://travis-ci.org/macacajs/macaca-puppeteer
[coveralls-image]: https://img.shields.io/coveralls/macacajs/macaca-puppeteer.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/macacajs/macaca-puppeteer?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square
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

|[<img src="https://avatars1.githubusercontent.com/u/1011681?v=4" width="100px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>
| :---: |


This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor.git), auto upated at `Sun Mar 25 2018 16:05:18 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->
