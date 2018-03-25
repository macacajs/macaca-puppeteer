'use strict';

const path = require('path');
const assert = require('assert');

const _ = require('../lib/helper');
const Puppeteer = require('../lib/macaca-puppeteer');

describe('unit testing', function() {
  this.timeout(5 * 60 * 1000);

  describe('base', function() {
    it('should be ok', function() {
      assert(Puppeteer);
    });
  });

  describe('methods testing', function() {

    var driver = new Puppeteer();
    var customUserAgent = 'custom userAgent';

    before(async () => {
      await driver.startDevice({
        show: true,
        userAgent: customUserAgent
      });
    });

    it('Puppeteer device should be ok', () => {
      assert(driver);
    });

    it('get should be ok', async () => {
      await driver.get('file://' + path.resolve(__dirname, 'webpages/1.html'));
      await driver.maximize();
      const html = await driver.getSource();
      assert(html.includes('<html>'));
      const uesrAgent = await driver.execute('return navigator.userAgent');
      assert.equal(uesrAgent, customUserAgent);
    });

    it('get title', async () => {
      const title = await driver.title();
      assert.equal(title, 'Document 1');
    });

    it('set window size', async () => {
      await driver.setWindowSize(null, 600, 600);
    });

    it('screenshot', async () => {
      const base64 = await driver.getScreenshot();
      assert(base64.match(/^[0-9a-z\/+=]+$/i));
    });

    it('set input value', async () => {
      const input = await driver.findElement('id', 'input');
      await driver.setValue(input.ELEMENT, 'aaa');
      await driver.clearText(input.ELEMENT);
      await driver.setValue(input.ELEMENT, 'macaca');
      const style = await driver.getComputedCss(input.ELEMENT, 'display');
      assert.equal(style, 'inline-block');
      await _.sleep(500);
    });

    it('element attr', async () => {
      const button = await driver.findElement('id', 'button-1');
      const buttonIsDiaplayed = await driver.isDisplayed(button.ELEMENT);
      assert.equal(buttonIsDiaplayed, true);

      const bgColor = await driver.getComputedCss(button.ELEMENT, 'background-color');
      assert.equal(bgColor, 'rgb(255, 255, 255)');
    });

    it('click button', async () => {
      const button = await driver.findElement('id', 'button-1');
      await driver.click(button.ELEMENT);
      await _.sleep(300);
      const box = await driver.findElement('id', 'target');
      const boxText = await driver.getText(box.ELEMENT);
      assert.equal(boxText, 'macaca');
    });

    it('click link', async () => {
      const link = await driver.findElement('id', 'link-1');
      await driver.click(link.ELEMENT);
      await _.sleep(1000);
      const title = await driver.title();
      assert.equal(title, 'Document 2');
    });

    it('history back', async () => {
      await driver.back();
      await _.sleep(1000);
      await driver.refresh();
      await _.sleep(1000);
      const title = await driver.title();
      assert.equal(title, 'Document 1');
    });

    it('open in new window', async () => {
      const link = await driver.findElement('id', 'link-2');
      await driver.click(link.ELEMENT);
      await driver.maximize();
      await _.sleep(1000);
    });

    it('window handlers', async () => {
      const windows = await driver.getWindows();
      assert.equal(windows.length, 1);
      const title = await driver.title();
      assert.equal(title, 'Document 1');
    });

    after(async () => {
      await driver.stopDevice();
    });

  });
});
