'use strict';

const path = require('path');
const puppeteer = require('puppeteer');
const DriverBase = require('driver-base');

const _ = require('./helper');
const pkg = require('../package');
const controllers = require('./controllers');

class Puppeteer extends DriverBase {

  constructor() {
    super();
    this.args = null;
    this.browser = null;
    this.frame = null;
    this.page = null;
    this.atoms = [];
  }

  *startDevice(caps) {
    this.args = _.clone(caps || {});
    this.browser = yield puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: !this.args.show
    });
    this.page = yield this.browser.newPage();
    yield this.page.setUserAgent(this.args.userAgent || pkg.description);
  }

  *stopDevice() {
    this.browser.close();
    this.browser = null;
  }

  isProxy() {
    return false;
  }

  whiteList(context) {
    var basename = path.basename(context.url);
    const whiteList = [];
    return !!~whiteList.indexOf(basename);
  }
}

_.extend(Puppeteer.prototype, controllers);

module.exports = Puppeteer;
