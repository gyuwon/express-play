function ContactsController() {
  var self = this;

  // Plain-old javascript style http request handler function.

  // GET /contacts
  // GET /contacts/:id
  self.get = function (id, Repository) {
    var repo = Repository; // Injected!
    if (id) {
      return repo.getContact(id);
    }
    else {
      return repo.getAllContacts();
    }
  };
}

module.exports = ContactsController;
