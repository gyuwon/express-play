/**
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Yi Gyuwon <gyuwon@live.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

var fs = require('fs')
  , util = require('util')
  , path = require('path')
  , fwalker = require('node-fwalker')
  , Controller = require('./controller');

/**
 * Resolve the root directory of the application.
 * This function is incompleted.
 */
function resolveRoot() {
  var resolved = null;
  try {
    resolved = path.dirname(require.resolve(process.cwd()));
  }
  catch (err) {
  }
  return resolved || process.cwd();
}

function firstDir(paths) {
  var dir = null;
  for (var i in paths) {
    var p = paths[i];
    if (fs.existsSync(p) &&
        fs.lstatSync(p).isDirectory()) {
      dir = p;
    }
  }
  return dir;
}

function resolveControllersDir(root) {
  var paths = []
    , controllers = 'controllers';

  if (typeof arguments[1] == 'string') {
    paths.push(
      arguments[1],
      path.join(root, arguments[1]));
  }

  paths.push(
    path.join(root, 'api', controllers),
    path.join(root, 'app', controllers),
    path.join(root, controllers));

  return firstDir(paths);
}

function resolveModulesDir(root) {
  var paths = [];

  if (typeof arguments[1] == 'string') {
    paths.push(
      arguments[1],
      path.join(root, arguments[1]));
  }

  ['modules', 'lib', 'libraries'].forEach(function (e) {
    paths.push(
      path.join(root, 'api', e),
      path.join(root, 'app', e),
      path.join(root, e));
  });

  return firstDir(paths);
}

/**
 * Load all modules in the specified directory recursively and regiser them to the IoC container.
 *
 * Parameters
 * - dir: A directory to load modules.
 * - IoC: The IoC container object.
 */
function bindModules(dir, IoC) {
  var suffix = '.js';
  fwalker.walkSync(dir, function (file, path) {
    // Check whether the file name matches '*.js'.
    if (file.indexOf(suffix, file.length - suffix.length) !== -1) {
      var name = file.substring(0, file.length - suffix.length)
        , module = require(path);
      // If the module is a function and has a name, set the module name to the function name.
      if (typeof module === 'function' && module.name.length > 0) {
        name = module.name;
      }
      IoC.bind(name, module);
    }
  });
}

/**
 * Initialize a new express-play framework object.
 *
 * Parameters
 * - settings: An object that contains settings of the framework instance.
 */
function Framework(settings) {
  var self = this
    , IoC = settings.IoC || require('inject-me')
    , root = settings.root || resolveRoot()
    , controllersDir = resolveControllersDir(root, settings.controllers)
    , controllers = []
    , modulesDir = resolveModulesDir(root, settings.modules)
    , app = settings.app || require('express')();

  util.log('Initializing a framework instance...');

  util.log('Root directory: ' + root);
  util.log('Controllers Directory: ' + controllersDir);
  util.log('Modules Directory: ' + modulesDir);

  if (modulesDir) {
    bindModules(modulesDir, IoC);
  }

  if (controllersDir) {
    controllers = Controller.loadControllers(controllersDir, IoC);
  }

  var mapRoutes = function () {
    self.controllers.forEach(function (controller) {
      controller.mapRoutes(self.app, self.IoC);
    });
  };

  self.IoC = IoC;
  self.root = root;
  self.controllers = controllers;
  self.app = app;
  self.mapRoutes = mapRoutes;

  /**
   * Map routes of controllers and call 'listen' function of an express application.
   *
   * Parameters: Refer to the express reference document.
   */
  self.play = function () {
    mapRoutes();
    self.app.listen.apply(self.app, arguments);
  };

  util.log('Initialized a framework instance');
}

module.exports = function () {
  var settings = arguments[0] || {};
  return new Framework(settings);
};

module.exports.play = function () {
  var framework = module.exports();
  framework.play.apply(framework, arguments);
  return framework;
};

module.exports.resolveRoot = resolveRoot;
