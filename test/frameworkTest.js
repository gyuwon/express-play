var should = require('should')
  , path = require('path')
  , sinon = require('sinon')
  , framework = require('../framework');

describe('generator', function () {
  it('should create a framework instance', function () {
    // Setup
    var root = path.join(__dirname, 'frameworkTest');

    // Exercise
    var inst = framework({
      root: root
    });

    // Verify
    should.exist(inst);
    inst.should.have.property('root');
    inst.should.have.property('app');
    inst.should.have.property('controllers');
    inst.controllers.should.be.instanceof(Array);
  });

  it('should load all modules in the modules directory recursively and regiser them to the IoC container', function () {
    // Setup
    var IoC = { bind: function () {} }
      , root = path.join(__dirname, 'frameworkTest')
      , mock = sinon.mock(IoC);
    mock.expects('bind').withArgs('coreModule');
    mock.expects('bind').withArgs('ServiceModule');

    // Exercise
    var inst = framework({
      IoC: IoC,
      root: root
    });

    // Verify
    mock.verify();
  });
});
