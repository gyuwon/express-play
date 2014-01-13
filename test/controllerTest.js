var should = require('should')
  , sinon = require('sinon')
  , path = require('path')
  , fromjs = require('fromjs')
  , Controller = require('../controller')
  , Handler = Controller.Handler;

describe('Controller', function () {
  var dir = path.join(__dirname, 'controllerTest', 'controllers');

  var controllersByName = function (controllers) {
    return controllers.reduce(function (byName, controller) {
      byName[controller.name] = controller;
      return byName;
    }, {});
  };

  describe('loadControllers', function () {
    it('should load all modules those are contained in the controllers directory', function () {
      // Setup

      // Exercise
      var controllers = Controller.loadControllers(dir);

      // Verify
      should.exist(controllers);
      controllers.should.be.instanceof(Array);

      var byName = controllersByName(controllers);

      byName.should.have.property('accounts');
      byName.should.have.property('home');
      byName.should.have.property('posts');
      byName.should.have.property('questions');
    });
  });

  var controllers = controllersByName(Controller.loadControllers(dir));

  it("should have 'path' property that represents the controller url path", function () {
    // Setup
    var accounts = controllers.accounts
      , posts = controllers.posts
      , questions = controllers.questions;

    // Exercise

    // Verify
    accounts.should.have.property('path').and.equal('accounts');
    posts.should.have.property('path').and.equal('contents/posts');
    questions.should.have.property('path').and.equal('contents/questions');
  });

  it('should have http handler objects', function () {
    // Setup

    // Exercise

    // Verify
    controllers.should.have.property('accounts');
    controllers.accounts.should.have.property('handlers');
    controllers.accounts.handlers.should.be.instanceof(Array).and.have.lengthOf(0);

    controllers.should.have.property('posts');
    controllers.posts.should.have.property('handlers');
    controllers.posts.handlers.should.be.instanceof(Array).and.have.lengthOf(5);

    controllers.should.have.property('questions');
    controllers.questions.should.have.property('handlers');
    controllers.questions.handlers.should.be.instanceof(Array).and.have.lengthOf(0);
  });

  describe('Handler', function () {
    var controller = controllers.posts;

    it("should have 'method' property that represents the HTTP method of the handler", function () {
      // Setup
      var get = controller.handlers[0];
      var post = controller.handlers[1];

      // Exercise

      // Verify
      get.should.have.property('method').and.equal('GET');
      post.should.have.property('method').and.equal('POST');
    });

    describe('mapRoute', function () {
      it("should call 'get' function for the handler of which the method is 'GET'", function () {
        // Setup
        var IoC = new (require('inject-me').constructor)()
          , getHandler = new Handler({}, ['comments'], 'get', function (id) {}, IoC)
          , app = { get: function () {} }
          , mock = sinon.mock(app);
        mock.expects('get').withArgs('/contents/posts/comments', getHandler.handler);
        mock.expects('get').withArgs('/contents/posts/comments/:id', getHandler.handler);

        // Exercise
        getHandler.mapRoutes('contents/posts', app, IoC);

        // Verify
        mock.verify();
      });
    });
  });
});
