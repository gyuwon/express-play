/* jshint -W030 */
/* global describe, it */

var should = require('should')
  , sinon = require('sinon')
  , path = require('path')
  , express = require('express')
  , generator = require('../framework');

describe('generator', function () {
  it('should generate a framework instance with __dirname', function () {
    // Setup

    // Exercise
    var framework = generator(__dirname);

    // Verify
    should.exist(framework);
    framework.should.have.property('root', __dirname);
    framework.app.should.be.ok;
  });

  it('should generate a framework instance with __dirname and the app instance', function () {
    // Setup
    var app = express();

    // Exercise
    var framework = generator(__dirname, app);

    // Verify
    should.exist(framework);
    framework.should.have.property('root', __dirname);
    framework.should.have.property('app', app);
  });

  it('should generate a framework instance with the options object', function () {
    // Setup
    var options = {
      root: __dirname,
      app: express()
    };

    // Exercise
    var framework = generator(options);

    // Verify
    should.exist(framework);
    framework.should.have.property('root', options.root);
    framework.should.have.property('app', options.app);
  });

  describe('dependency injection', function () {
    it('should load modules in the specified location', function () {
      // Setup
      var options = {
        root: __dirname,
        modules: path.join(__dirname, 'dependency-injection', 'modules')
      };

      // Exercise
      var framework = generator(options)
        , module1 = framework.IoC.get('module1')
        , module2 = framework.IoC.get('Module2');

      // Verify
      should.exist(module1);
      module1.value.should.equal('Hello World');
      should.exist(module2);
      module2.value.should.equal(module1.value);
    });
  });
});

describe('play', function () {
  describe('routes', function () {
    it('should call express get function with a get controller function', function () {
      // Setup
      var app = express()
        , mock = sinon.mock(app);
      mock.expects('get').twice();
      mock.expects('listen').once();

      var options = {
        root: path.join(__dirname, 'api'),
        app: app
      };

      // Exercise
      generator(options).play();

      // Verify
      mock.verify();
    });
  });
});

