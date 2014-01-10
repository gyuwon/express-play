function ContactsController(Repository) {
  var self = this
    , repo = Repository;

  self.get = function (id) {
    if (id) {
      return repo.getContact(id);
    }
    else {
      return repo.getAllContacts();
    }
  };
}

module.exports = ContactsController;
