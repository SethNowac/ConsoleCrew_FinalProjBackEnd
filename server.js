require ('dotenv').config();
const app = require('./app.js');

const url = process.env.URL_PRE + process.env.MONGODB_PWD + process.env.URL_POST;
const port = 1339;

const model = require("./models/gameOrganizerModelMongoDb");

model.initialize("GameOrganizerDB", true, url)
    .then(
        app.listen(port) // Run the server
    );