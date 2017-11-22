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

> [Puppeteer](//github.com/GoogleChrome/puppeteer) is a Node library which provides a high-level API to control headless Chrome over the DevTools Protocol. It can also be configured to use full (non-headless) Chrome.

## Installment

```bash
$ npm i macaca-puppeteer -g
```

## Usage as module

```javascript

const co = require('co');
const fs = require('fs');
const path = require('path');
const Puppeteer = require('macaca-puppeteer');

const puppeteer = new Puppeteer();

co(function *() {
  /**
    default options
    {
      show: true,
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      userAgent: 'userAgent string'
    }
  */
  yield puppeteer.startDevice({
    show: false // in silence
  });

  yield puppeteer.maximize();
  yield puppeteer.setWindowSize(null, 500, 500);
  yield puppeteer.get('https://www.baidu.com');
  const imgData = yield puppeteer.getScreenshot();
  const img = new Buffer(imgData, 'base64');
  const p = path.join(__dirname, '..', 'screenshot.png')
  fs.writeFileSync(p, img.toString('binary'), 'binary');
  console.log(`screenshot: ${p}`);

  yield puppeteer.stopDevice();
});
```

- [sample](//github.com/macaca-sample/sample-nodejs)
- [More API](//macacajs.github.io/macaca-puppeteer/)
