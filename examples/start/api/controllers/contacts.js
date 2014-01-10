var from = require('fromjs')
  , contacts = require('./contacts.json');

function ContactsController() {
  var self = this;

  self.get = function (id) {
    if (id) {
      return from(contacts).singleOrDefault(function (e) { return e.id == id; }, null);
    }
    else {
      return contacts;
    }
  };
}

module.exports = ContactsController;
