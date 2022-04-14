'use strict';

const { getByName: getAtom } = require('selenium-atoms');
const { errors } = require('webdriver-dfn-error-code');

const _ = require('./helper');
const logger = require('./logger');

const ELEMENT_OFFSET = 1000;

const implicitWaitForCondition = function(func) {
  return _.waitForCondition(func, this.implicitWaitMs);
};

const sendJSCommand = async function(atom, args, inDefaultFrame) {
  const frames = !inDefaultFrame && this.frame ? [ this.frame ] : [];
  const atomScript = getAtom(atom);
  let script;
  if (frames.length) {
    const elem = getAtom('get_element_from_cache');
    const frame = frames[0];
    script = `(function (window) { var document = window.document;
      return (${atomScript}); })((${elem.toString('utf8')})(${JSON.stringify(frame)}))`;
  } else {
    script = `(${atomScript})`;
  }
  const command = `${script}(${args.map(JSON.stringify).join(',')})`;
  const res = await this.page.evaluate(command);

  if (res.value) {
    return res.value;
  }

  try {
    return JSON.parse(res).value;
  } catch (e) {
    return null;
  }
};

const convertAtoms2Element = function(atoms) {
  const atomsId = atoms && atoms.ELEMENT;

  if (!atomsId) {
    return null;
  }

  const index = this.atoms.push(atomsId) - 1;

  return {
    ELEMENT: index + ELEMENT_OFFSET,
  };
};

const convertElement2Atoms = function(elementId) {
  if (!elementId) {
    return null;
  }

  let atomsId;

  try {
    atomsId = this.atoms[parseInt(elementId, 10) - ELEMENT_OFFSET];
  } catch (e) {
    return null;
  }

  return {
    ELEMENT: atomsId,
  };
};

const findElementOrElements = async function(strategy, selector, ctx, many) {
  let result;
  const that = this;

  const atomsElement = convertElement2Atoms.call(this, ctx);

  try {
    await implicitWaitForCondition.call(this, async function() {
      result = await sendJSCommand.call(that, `find_element${many ? 's' : ''}`, [
        strategy,
        selector,
        atomsElement,
      ]);
      return _.size(result) > 0;
    });
  } catch (err) {
    result = [];
  }

  if (many) {
    return result.map(convertAtoms2Element.bind(this));
  }
  if (!result || _.size(result) === 0) {
    throw new errors.NoSuchElement();
  }
  return convertAtoms2Element.call(this, result);
  
};

const controllers = {};

/**
 * Change focus to another frame on the page.
 *
 * @module setFrame
 * @param {string} frame Identifier(id/name) for the frame to change focus to
 * @return {Promise}
 */
controllers.setFrame = async function(frame) {
  if (!frame) {
    this.frame = null;
    logger.debug('Back to default content');
    return null;
  }

  if (frame.ELEMENT) {
    const atomsElement = convertElement2Atoms.call(this, frame.ELEMENT);
    const result = await sendJSCommand.call(this, 'get_frame_window', [ atomsElement ]);
    logger.debug(`Entering into web frame: '${result.WINDOW}'`);
    this.frame = result.WINDOW;
    return null;
  }
  const atom = _.isNumber(frame) ? 'frame_by_index' : 'frame_by_id_or_name';
  const result = await sendJSCommand.call(this, atom, [ frame ]);
  if (!result || !result.WINDOW) {
    throw new errors.NoSuchFrame();
  }
  logger.debug(`Entering into web frame: '${result.WINDOW}'`);
  this.frame = result.WINDOW;
  return null;
  
};

/**
 * Click on an element.
 *
 * @module click
 * @return {Promise}
 */
controllers.click = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'click', [ atomsElement ]);
};

/**
 * Search for an element on the page, starting from the document root.
 * @module findElement
 * @param {string} strategy The type
 * @param {string} using The locator strategy to use.
 * @param {string} value The search target.
 * @return {Promise.<Element>}
 */
controllers.findElement = async function(strategy, selector, ctx) {
  return await findElementOrElements.call(this, strategy, selector, ctx, false);
};

controllers.findElements = async function(strategy, selector, ctx) {
  return await findElementOrElements.call(this, strategy, selector, ctx, true);
};

/**
 * Returns the visible text for the element.
 *
 * @module getText
 * @return {Promise.<string>}
 */
controllers.getText = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'get_text', [ atomsElement ]);
};

/**
 * Clear a TEXTAREA or text INPUT element's value.
 *
 * @module clearText
 * @return {Promise.<string>}
 */
controllers.clearText = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'clear', [ atomsElement ]);
};

/**
 * Set element's value.
 *
 * @module setValue
 * @param elementId
 * @param value
 * @return {Promise.<string>}
 */
controllers.setValue = async function(elementId, value) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  await sendJSCommand.call(this, 'click', [ atomsElement ]);
  return await sendJSCommand.call(this, 'type', [ atomsElement, value ]);
};

/**
 * Determine if an element is currently displayed.
 *
 * @module isDisplayed
 * @return {Promise.<string>}
 */
controllers.isDisplayed = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'is_displayed', [ atomsElement ]);
};

/**
 * Get the value of an element's property.
 *
 * @module getProperty
 * @return {Promise.<string>}
 */
controllers.getProperty = async function(elementId, attrName) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'get_attribute_value', [
    atomsElement,
    attrName,
  ]);
};

/**
 * Get the current page title.
 *
 * @module title
 * @return {Promise.<Object>}
 */
controllers.title = async function() {
  return await this.page.title();
};

/**
 * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
 *
 * @module execute
 * @param code script
 * @param [args] script argument array
 * @return {Promise.<string>}
 */
controllers.execute = async function(script, args) {
  if (!args) {
    args = [];
  }

  // args = args.map(arg => {
  //   if (arg.ELEMENT) {
  //     return convertElement2Atoms.call(this, arg.ELEMENT);
  //   } else {
  //     return arg;
  //   }
  // });

  const value = await sendJSCommand.call(this, 'execute_script', [
    script,
    args,
  ], true);

  if (Array.isArray(value)) {
    return value.map(convertAtoms2Element.bind(this));
  }
  return value;
  
};

/**
 * Retrieve the URL of the current page.
 *
 * @module url
 * @return {Promise.<string>}
 */
controllers.url = async function() {
  return await this.page.url();
};

/**
 * Navigate to a new URL.
 *
 * @module get
 * @param url get a new url.
 * @return {Promise.<string>}
 */
controllers.get = async function(url) {
  this.frame = null;
  await this.page.goto(url, {
    waitUntil: 'load' || 'networkidle',
  });
  return null;
};

/**
 * Navigate forwards in the browser history, if possible.
 *
 * @module forward
 * @return {Promise.<string>}
 */
controllers.forward = async function() {
  this.frame = null;
  await this.page.goForward();
  return null;
};

/**
 * Navigate backwards in the browser history, if possible.
 *
 * @module back
 * @return {Promise.<string>}
 */
controllers.back = async function() {
  this.frame = null;
  await this.page.goBack();
  return null;
};

/**
 * Get all window handlers.
 *
 * @module back
 * @return {Promise}
 */
controllers.getWindows = async function() {
  return await this.page.frames();
};

controllers.setWindow = async function() {
  throw new errors.NotImplementedError();
};

/**
 * Get the size of the specified window.
 *
 * @module setWindowSize
 * @param [handle] window handle to set size for (optional, default: 'current')
 * @return {Promise.<string>}
 */
controllers.setWindowSize = async function(windowHandle, width, height) {
  await this.page.setViewport({
    width,
    height,
    hasTouch: true,
    deviceScaleFactor: this.args.deviceScaleFactor || 1,
  });
  return null;
};

/**
 * Maximize the specified window if not already maximized.
 *
 * @module maximize
 * @param handle window handle
 * @return {Promise.<string>}
 */
controllers.maximize = async function(windowHandle) {
  return await this.setWindowSize(windowHandle, 1280, 800);
};

/**
 * Refresh the current page.
 *
 * @module refresh
 * @return {Promise.<string>}
 */
controllers.refresh = async function() {
  this.frame = null;
  return await this.page.reload();
};

/**
 * Get the current page source.
 *
 * @module getSource
 * @return {Promise.<string>}
 */
controllers.getSource = async function() {
  const cmd = 'return document.getElementsByTagName(\'html\')[0].outerHTML';
  return await this.execute(cmd);
};

/**
 * Take a screenshot of the current page.
 *
 * @module getScreenshot
 * @return {Promise.<string>} The screenshot as a base64 encoded PNG.
 */
controllers.getScreenshot = async function(context, params = {}) {
  if (params.fullPage) {
    params.fullPage = params.fullPage === 'true';
  }
  const image = await this.page.screenshot(Object.assign({
    fullPage: true,
  }, params));
  const base64 = image.toString('base64');
  return base64;
  // let dir = path.join(process.cwd(), data.dir);
  // _.mkdir(path.dirname(dir));
  // fs.writeFileSync(dir, img.toString('binary'), 'binary');
};

/**
 * Query the value of an element's computed CSS property.
 *
 * @module getComputedCss
 * @return {Promise.<string>}
 */
controllers.getComputedCss = async function(elementId, propertyName) {
  return await this.execute('return window.getComputedStyle(arguments[0], null).getPropertyValue(arguments[1]);', [
    convertElement2Atoms.call(this, elementId),
    propertyName,
  ]);
};

/**
 * Returns all cookies associated with the address of the current browsing context’s active document.
 *
 * @module getAllCookies
 * @return {Promise.<string>}
 */
controllers.getAllCookies = async function() {
  return await this.page.cookies();
};

/**
 * Returns the cookie with the requested name from the associated cookies in the cookie store of the current browsing context’s active document. If no cookie is found, a no such cookie error is returned.
 *
 * @module getNamedCookie
 * @return {Promise.<string>}
 */
controllers.getNamedCookie = async function() {
  return await this.page.cookies();
};

/**
 * Adds a single cookie to the cookie store associated with the active document’s address.
 *
 * @module addCookie
 * @return {Promise.<string>}
 */
controllers.addCookie = async function(cookie) {
  await this.page.setCookie(cookie);
  return null;
};

/**
 * Delete either a single cookie by parameter name, or all the cookies associated with the active document’s address if name is undefined.
 *
 * @module deleteCookie
 * @return {Promise.<string>}
 */
controllers.deleteCookie = async function(cookie) {
  return await this.page.deleteCookie(cookie);
};

/**
 * Delete All Cookies command allows deletion of all cookies associated with the active document’s address.
 *
 * @module deleteAllCookies
 * @return {Promise.<string>}
 */
controllers.deleteAllCookies = async function() {
  return await this.page.deleteCookie();
};

module.exports = controllers;
