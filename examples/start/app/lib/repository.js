var from = require('fromjs');

function Repository() {
  var self = this
    , contacts = require('./contacts.json')
    , dummyPromise = {};
  dummyPromise.then = function () {
    return dummyPromise;
  };
  dummyPromise.catch = function () {
    return dummyPromise;
  };

  self.getContact = function (id) {
    return {
      then: function (callback) {
        setTimeout(function () {
          callback(from(contacts).singleOrDefault(function (e) { return e.id == id; }, null));
        });
        return dummyPromise;
      },
      catch: function () {
        return dummyPromise;
      }
    };
  };

  self.getAllContacts = function () {
    return {
      then: function (callback) {
        setTimeout(function () {
          callback(contacts);
        });
        return dummyPromise;
      },
      catch: function () {
        return dummyPromise;
      }
    };
  };
}

module.exports = Repository;
