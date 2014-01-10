/*
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
  , path = require('path')
  , IoC = require('inject-me')
  , functionSignature = require('function-signature')
  , err_msg_invalid_root = "'root' must be the string which contains the directory path."
  , err_msg_invalid_controllers = "'controllers' must be the string which contains the directory path."
  , err_msg_routes_already_mapped = 'Controller routes are already mapped.';

function Framework (options) {
  var self = this;

  Object.defineProperty(self, 'root', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: options.root
  });

  Object.defineProperty(self, 'app', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: options.app
  });

  Object.defineProperty(self, 'IoC', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: IoC
  });

  var _selectControllersDirectory = function () {
    var candidates = [];
    if (typeof options.controllers === 'string') {
      candidates.push(options.controllers);
      candidates.push(path.join(self.root, options.controllers));
    }
    candidates.push(path.join(self.root, 'app', 'controllers'));
    candidates.push(path.join(self.root, 'api', 'controllers'));
    candidates.push(path.join(self.root, 'controllers'));

    var i, controllersDirectory = null;
    for (i in candidates) {
      var p = candidates[i];
      if (fs.existsSync(p) &&
          fs.statSync(p).isDirectory) {
        controllersDirectory = p;
      }
    }
    return controllersDirectory;
  };

  var _traverse = function (directory, callback) {
    var fileNames = fs.readdirSync(directory);
    for (var i in fileNames) {
      var fileName = fileNames[i]
        , filePath = path.join(directory, fileName);
      if (fs.statSync(filePath).isDirectory()) {
        _traverse(filePath, callback);
      }
      else {
        callback(fileName, filePath);
      }
    }
  };

  var _loadControllers = function (directory) {
    var controllers = {}
      , suffix = '.js';
    _traverse(directory, function (fileName, filePath) {
      if (fileName.indexOf(suffix, fileName.length - suffix.length) !== -1) {
        var controllerName = fileName.substring(0, fileName.length - suffix.length);
        if (controllers[controllerName]) {
          return;
        }
        controllers[controllerName] = require(filePath);
      }
    });
    return controllers;
  };

  var _routesMapped = false;

  var _mapController = function (controllerName, controller) {
    var inst = typeof controller === 'function' ? IoC.inject(controller) : controller;
    for (var propName in inst) {
      var prop = inst[propName];
      if (typeof prop === 'function') {
        _mapAction(controllerName, controller, propName, prop);
      }
    }
  };

  var _isThenable = function (obj) {
    if (!obj) {
      return false;
    }
    var then = obj.then;
    return typeof then === 'function';
  };

  var _handle = function (res, resource) {
    if (typeof resource !== 'undefined') {
      if (resource === null) {
        res.status(404);
        res.end();
      }
      else {
        res.send(resource);
      }
    }
  };

  var _handler = function (controller, action) {
    var signature = functionSignature(action);
    return function (req, res) {
      var params = {
        req: req,
        res: res,
        request: req,
        response: res
      };
      for (var p in req.params) {
        params[p] = req.params[p];
      }
      for (var q in req.query) {
        params[q] = req.query[q];
      }
      try {
        var resource = functionSignature.invoke(controller, action, signature, params);
        if (_isThenable(resource)) {
          var promise = resource;
          promise.then(function (r) {
            _handle(res, r);
          }).catch(function (err) {
            res.status(500);
            res.send(err);
          });
        }
        else {
          _handle(res, resource);
        }
      }
      catch (err) {
        res.status(500);
        res.send(err);
      }
    };
  };

  var _mapAction = function (controllerName, controller, actionName, action) {
    var handler = _handler(controller, action);
    if (actionName === 'get') {
      self.app.get('/' + controllerName, handler);
      self.app.get('/' + controllerName + '/:id', handler);
    }
  };

  self.mapRoutes = function () {
    if (_routesMapped) {
      throw new Error(err_msg_routes_already_mapped);
    }
    var controllersDirectory = _selectControllersDirectory();
    var controllers = _loadControllers(controllersDirectory);
    for (var controllerName in controllers) {
      _mapController(controllerName, controllers[controllerName]);
    }
  };

  self.play = function () {
    if (!_routesMapped) {
      self.mapRoutes();
    }

    self.app.listen.apply(self.app, arguments);
  };
}

module.exports = function (root, app) {
  if (typeof root === 'object') {
    var options = root;
    root = options.root;
    app = options.app;
  }

  if (typeof root !== 'string') {
    throw new Error(err_msg_invalid_root);
  }
  try {
    var stat = fs.statSync(root);
    if (!stat.isDirectory()) {
      throw new Error(err_msg_invalid_root);
    }
  }
  catch (exception) {
    throw new Error(err_msg_invalid_root);
  }

  if (!app) {
    app = require('express')();
  }

  return new Framework({ root: root, app: app });
};
