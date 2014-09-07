/**
 * NoteController
 *
 * @description :: Server-side logic for managing notes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Evernote = require('evernote').Evernote;

module.exports = {
  create: function (req, res) {
    var params = req.params.all();

    var nBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    nBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";
    nBody += "<en-note>" + params.body + "</en-note>";
   
    // Create note object
    var newNote = new Evernote.Note();
    newNote.title = params.title;
    newNote.content = nBody;

    var client = new Evernote.Client({token: params.authToken, sandbox: true});
    var noteStore = client.getNoteStore();
   
    // Attempt to create note in Evernote account
    noteStore.createNote(newNote, function (err, note) {
      if (err) {
        // Something was wrong with the note data
        // See EDAMErrorCode enumeration for error code explanation
        // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
        console.log(err);
      } else {
        return Note.create(params).exec(function (err, notes) {
          if (err) {
            res.send(400);
          } else {
            res.send(notes);
          }
        });
      }
    });
  }
};
