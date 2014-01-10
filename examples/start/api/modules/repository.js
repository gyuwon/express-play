var from = require('fromjs');

function Repository() {
  var self = this
    , contacts = require('./contacts.json')
    , idle = function () {};

  self.getContact = function (id) {
    return {
      then: function (callback) {
        setTimeout(function () {
          callback(from(contacts).singleOrDefault(function (e) { return e.id == id; }, null));
        });
        return {
          catch: idle
        };
      },
      catch: idle
    };
  };

  self.getAllContacts = function () {
    return {
      then: function (callback) {
        setTimeout(function () {
          callback(contacts);
        });
        return {
          catch: idle
        };
      },
      catch: idle
    };
  };
}

module.exports = Repository;
