var mongoose = require('mongoose');

//schema is used to structure data and this structure is a form which is used for the front end files, so we can save data to a database
const ContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    number: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});
//module.exports to 'expose' this module, so it can be called in a different files of our project
module.exports = Contact = mongoose.model('contact', ContactSchema);