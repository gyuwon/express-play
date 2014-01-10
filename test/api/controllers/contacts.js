function ContactsController() {
  var self = this;

  var contacts = [
    { id: 1, firstName: "Tony", lastName: "Stark", email: "ironman@avengers.com" },
    { id: 2, firstName: "Bruce", lastName: "Banner", email: "hulk@avengers.com" },
    { id: 3, firstName: "Thor", lastName: "Odinson", email: "thor@avengers.com" }
  ];

  self.get = function (id) {
    if (id) {
      return null;
    }
    else {
      return contacts;
    }
  };

  self.post = function (contact) {

  };
}

module.exports = ContactsController;
