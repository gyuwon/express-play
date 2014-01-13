function ServiceModule(coreModule) {
  this.foo = function () {
    return coreModule.foo();
  };
}

module.exports = ServiceModule;
