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
  , functionSignature = require('function-signature')
  , fwalker = require('node-fwalker');

/**
 * Check whether an object is a promise.
 *
 * Parameters
 * - obj: An object to check.
 *
 * Returns: true if 'obj' is a promise, otherwise false.
 */
var isPromise = function (obj) {
  if (!obj) {
    return false;
  }
  return typeof obj.then == 'function' && typeof obj.catch == 'function';
};

/**
 * Initialize a new object that encapsulates information of the http request handler of a controller.
 *
 * Parameters
 * - controller: An instance of a controller.
 * - path: An array of the handler path fragments.
 * - name: The handler name.
 * - func: The handler function.
 * - [IoC]: The IoC container object.
 */
function Handler(controller, path, name, func, IoC) {
  var self = this
    , upper = name.toUpperCase()
    , sig = functionSignature(func)
    , method = 'GET'
    , paths = [];

  if (!IoC) {
    IoC = require('inject-me');
  }

  switch (upper) {
    case 'GET':
    case 'POST':
    case 'PUT':
    case 'DELETE':
      method = upper;
      paths.push(path.join('/'));
      break;

    default:
      paths.push(path.concat([name]).join('/'));
      break;
  }

  // If the handler function has 'id' argument, add a path with ':id' suffix.
  if (sig.params.map.id >= 0) {
    if (paths[0] === '') {
      paths.push(':id');
    }
    else {
      paths.push(paths[0] + '/:id');
    }
  }

  // Define the handler function wrapper.
  var handler = function (req, res) {
    // Set default arguments.
    var params = {
      req: req,
      res: res
    };
    for (var p in req.params) {
      params[p] = req.params[p];
    }
    for (var q in req.query) {
      params[q] = req.query[q];
    }

    try {
      // Define a function to be called after the execution of the handler function regardless of errors.
      var always = function () {

      };

      // Define the internal server error(500) handler.
      var error500 = function (err) {
        res.status(500);
        res.send(err.stack);
        util.log(err.stack);
      };

      var handleResource = function (resource) {
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

      // Call the handler function with dependencies.
      var resource = IoC.call(controller, self.func, params);

      if (isPromise(resource)) {
        // Asynchronous process
        var promise = resource;
        promise.then(handleResource).catch(function (err) {
          error500(err);
        }).then(function () {
          always();
        });
      }
      else {
        // Synchronous process
        handleResource(resource);
        always();
      }
    }
    catch (err) {
      error500(err);
      always();
    }
  };

  self.name = name;
  self.method = method;
  self.paths = paths;
  self.func = func;
  self.controller = controller;
  self.handler = handler;
}

/**
 * Map all routes of this handler.
 *
 * Parameters
 * - controllerPath: The url path to the controller.
 * - app: An instance of the express application.
 * - [IoC]: The IoC container object.
 */
Handler.prototype.mapRoutes = function (controllerPath, app, IoC) {
  var self = this
    , methodLower = this.method.toLowerCase();
  if (typeof app[methodLower] === 'function') {
    this.paths.forEach(function (elem) {
      var path = '/' + [controllerPath, elem].reduce(function (previous, current) {
        if (current && current !== '') {
          previous.push(current);
        }
        return previous;
      }, []).join('/');
      util.log('Route: ' + self.method + ' ' + path);
      app[methodLower].call(app, path, self.handler);
    });
  }
};

/**
 * Get handlers from the specified controller instance.
 *
 * Parameters
 * - controller: An instance of a controller.
 * - [IoC]: The IoC container object.
 *
 * Returns: An array that contains objects those encapsulates information of handlers.
 */
Handler.getHandlers = function (controller, IoC) {
  var handlers = [];

  var traverse = function (path, node) {
    for (var propName in node) {
      var prop = node[propName];
      if (typeof prop == 'function') {
        handlers.push(new Handler(controller, path.slice(0), propName, prop, IoC));
      }
      else if (typeof prop == 'object') {
        path.push(propName);
        try {
          traverse(path, prop);
        }
        finally {
          path.pop();
        }
      }
    }
  };
  traverse([], controller);

  return handlers;
};

/**
 * Initialize a new object that encapsulates information of controller.
 *
 * Parameters
 * - trace: The path to the controller.
 * - name: The controller name.
 * - source: The source of the controller.
 * - [IoC]: The IoC container object.
 */
function Controller(trace, name, source, IoC) {
  var self = this;

  if (!IoC) {
    IoC = require('inject-me');
  }

  var getInstance = function () {
    return typeof source == 'function' ? IoC.inject(source) : source;
  };

  self.name = name;
  self.path = trace.concat([name]).join('/');
  self.handlers = Handler.getHandlers(getInstance(), IoC);
}

/**
 * Map routes of all handler contained in this controller.
 *
 * Parameters
 * - app: An instance of the express application.
 * - [IoC]: The IoC container object.
 */
Controller.prototype.mapRoutes = function (app, IoC) {
  var self = this;

  if (!IoC) {
    IoC = require('inject-me');
  }

  this.handlers.forEach(function (handler) {
    handler.mapRoutes(self.path, app, IoC);
  });
};

/**
 * Load controllers from the controllers root directory.
 *
 * Parameters
 * - dir: Controllers root directory.
 * - [IoC]: The IoC container object.
 *
 * Returns: An array that contains object those encapsulate information of controllers.
 */
Controller.loadControllers = function (dir, IoC) {
  util.log('Loading controllers...');

  util.log('Controllers directory: ' + dir);

  var controllers = [], suffix = '.js';
  fwalker.walkSync(dir, function (file, path, isDir, trace) {
    if (isDir) {
      return;
    }
    // Check whether the file name matches '*.js'.
    if (file.indexOf(suffix, file.length - suffix.length) !== -1) {
      var name = file.substring(0, file.length - suffix.length);
      util.log('Loading ' + name + ' from the file ' + file + '...');
      controllers.push(new Controller(trace(), name, require(path), IoC));
    }
  });

  util.log('Loaded controllers');

  return controllers;
};

module.exports = Controller;
module.exports.Handler = Handler;
