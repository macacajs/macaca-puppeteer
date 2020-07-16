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
  let frames = !inDefaultFrame && this.frame ? [this.frame] : [];
  let atomScript = getAtom(atom);
  let script;
  if (frames.length) {
    let elem = getAtom('get_element_from_cache');
    let frame = frames[0];
    script = `(function (window) { var document = window.document;
      return (${atomScript}); })((${elem.toString('utf8')})(${JSON.stringify(frame)}))`;
  } else {
    script = `(${atomScript})`;
  }
  const command = `${script}(${args.map(JSON.stringify).join(',')})`;
  var res = await this.page.evaluate(command);

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
    ELEMENT: index + ELEMENT_OFFSET
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
    ELEMENT: atomsId
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
        atomsElement
      ]);
      return _.size(result) > 0;
    });
  } catch (err) {
    result = [];
  }

  if (many) {
    return result.map(convertAtoms2Element.bind(this));
  } else {
    if (!result || _.size(result) === 0) {
      throw new errors.NoSuchElement();
    }
    return convertAtoms2Element.call(this, result);
  }
};

const controllers = {};

/**
 * Change focus to another frame on the page.
 *
 * @module setFrame
 * @param {string} frame Identifier(id/name) for the frame to change focus to
 * @returns {Promise}
 */
controllers.setFrame = async function(frame) {
  if (!frame) {
    this.frame = null;
    logger.debug('Back to default content');
    return null;
  }

  if (frame.ELEMENT) {
    let atomsElement = convertElement2Atoms.call(this, frame.ELEMENT);
    let result = await sendJSCommand.call(this, 'get_frame_window', [atomsElement]);
    logger.debug(`Entering into web frame: '${result.WINDOW}'`);
    this.frame = result.WINDOW;
    return null;
  } else {
    let atom = _.isNumber(frame) ? 'frame_by_index' : 'frame_by_id_or_name';
    let result = await sendJSCommand.call(this, atom, [frame]);
    if (!result || !result.WINDOW) {
      throw new errors.NoSuchFrame();
    }
    logger.debug(`Entering into web frame: '${result.WINDOW}'`);
    this.frame = result.WINDOW;
    return null;
  }
};

/**
 * Click on an element.
 *
 * @module click
 * @returns {Promise}
 */
controllers.click = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'click', [atomsElement]);
};

/**
 * Search for an element on the page, starting from the document root.
 * @module findElement
 * @param {string} strategy The type
 * @param {string} using The locator strategy to use.
 * @param {string} value The search target.
 * @returns {Promise.<Element>}
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
 * @returns {Promise.<string>}
 */
controllers.getText = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'get_text', [atomsElement]);
};

/**
 * Clear a TEXTAREA or text INPUT element's value.
 *
 * @module clearText
 * @returns {Promise.<string>}
 */
controllers.clearText = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'clear', [atomsElement]);
};

/**
 * Set element's value.
 *
 * @module setValue
 * @param elementId
 * @param value
 * @returns {Promise.<string>}
 */
controllers.setValue = async function(elementId, value) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  await sendJSCommand.call(this, 'click', [atomsElement]);
  return await sendJSCommand.call(this, 'type', [atomsElement, value]);
};

/**
 * Determine if an element is currently displayed.
 *
 * @module isDisplayed
 * @returns {Promise.<string>}
 */
controllers.isDisplayed = async function(elementId) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'is_displayed', [atomsElement]);
};

/**
 * Get the value of an element's property.
 *
 * @module getProperty
 * @returns {Promise.<string>}
 */
controllers.getProperty = async function(elementId, attrName) {
  const atomsElement = convertElement2Atoms.call(this, elementId);
  return await sendJSCommand.call(this, 'get_attribute_value', [
    atomsElement,
    attrName
  ]);
};

/**
 * Get the current page title.
 *
 * @module title
 * @returns {Promise.<Object>}
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
 * @returns {Promise.<string>}
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
    args
  ], true);

  if (Array.isArray(value)) {
    return value.map(convertAtoms2Element.bind(this));
  } else {
    return value;
  }
};

/**
 * Retrieve the URL of the current page.
 *
 * @module url
 * @returns {Promise.<string>}
 */
controllers.url = async function() {
  return await this.page.url();
};

/**
 * Navigate to a new URL.
 *
 * @module get
 * @param url get a new url.
 * @returns {Promise.<string>}
 */
controllers.get = async function(url) {
  this.frame = null;
  await this.page.goto(url, {
    waitUntil: 'load' || 'networkidle'
  });
  return null;
};

/**
 * Navigate forwards in the browser history, if possible.
 *
 * @module forward
 * @returns {Promise.<string>}
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
 * @returns {Promise.<string>}
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
 * @returns {Promise}
 */
controllers.getWindows = async function() {
  return await this.page.frames();
};

controllers.setWindow = async function(windowHandle) {
  throw new errors.NotImplementedError();
};

/**
 * Get the size of the specified window.
 *
 * @module setWindowSize
 * @param [handle] window handle to set size for (optional, default: 'current')
 * @returns {Promise.<string>}
 */
controllers.setWindowSize = async function(windowHandle, width, height) {
  await this.page.setViewport({
    width: width,
    height: height,
    hasTouch: true,
    deviceScaleFactor: this.args.deviceScaleFactor || 1
  });
  return null;
};

/**
 * Maximize the specified window if not already maximized.
 *
 * @module maximize
 * @param handle window handle
 * @returns {Promise.<string>}
 */
controllers.maximize = async function(windowHandle) {
  return await this.setWindowSize(windowHandle, 1280, 800);
};

/**
 * Refresh the current page.
 *
 * @module refresh
 * @returns {Promise.<string>}
 */
controllers.refresh = async function() {
  this.frame = null;
  return await this.page.reload();
};

/**
 * Get the current page source.
 *
 * @module getSource
 * @returns {Promise.<string>}
 */
controllers.getSource = async function() {
  const cmd = 'return document.getElementsByTagName(\'html\')[0].outerHTML';
  return await this.execute(cmd);
};

/**
 * Take a screenshot of the current page.
 *
 * @module getScreenshot
 * @returns {Promise.<string>} The screenshot as a base64 encoded PNG.
 */
controllers.getScreenshot = async function(context, params = {}) {
  if (params.fullPage) {
    params.fullPage = params.fullPage === 'true';
  }
  var image = await this.page.screenshot(Object.assign({
    fullPage: true
  }, params));
  let base64 = image.toString('base64');
  return base64;
  // let dir = path.join(process.cwd(), data.dir);
  // _.mkdir(path.dirname(dir));
  // fs.writeFileSync(dir, img.toString('binary'), 'binary');
};

/**
 * Query the value of an element's computed CSS property.
 *
 * @module getComputedCss
 * @returns {Promise.<string>}
 */
controllers.getComputedCss = async function(elementId, propertyName) {
  return await this.execute('return window.getComputedStyle(arguments[0], null).getPropertyValue(arguments[1]);', [
    convertElement2Atoms.call(this, elementId),
    propertyName
  ]);
};

/**
 * Returns all cookies associated with the address of the current browsing context’s active document.
 *
 * @module getAllCookies
 * @returns {Promise.<string>}
 */
controllers.getAllCookies = async function() {
  return await this.page.cookies();
};

/**
 * Returns the cookie with the requested name from the associated cookies in the cookie store of the current browsing context’s active document. If no cookie is found, a no such cookie error is returned.
 *
 * @module getNamedCookie
 * @returns {Promise.<string>}
 */
controllers.getNamedCookie = async function(name) {
  return await this.page.cookies();
};

/**
 * Adds a single cookie to the cookie store associated with the active document’s address.
 *
 * @module addCookie
 * @returns {Promise.<string>}
 */
controllers.addCookie = async function(cookie) {
  await this.page.setCookie(cookie);
  return null;
};

/**
 * Delete either a single cookie by parameter name, or all the cookies associated with the active document’s address if name is undefined.
 *
 * @module deleteCookie
 * @returns {Promise.<string>}
 */
controllers.deleteCookie = async function(cookie) {
  return await this.page.deleteCookie(cookie);
};

/**
 * Delete All Cookies command allows deletion of all cookies associated with the active document’s address.
 *
 * @module deleteAllCookies
 * @returns {Promise.<string>}
 */
controllers.deleteAllCookies = async function() {
  return await this.page.deleteCookie();
};

module.exports = controllers;
