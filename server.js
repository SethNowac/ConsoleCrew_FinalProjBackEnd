require ('dotenv').config();
const app = require('./app.js');

const url = process.env.URL_PRE + process.env.MONGODB_PWD + process.env.URL_POST;
const port = 1339;

const categoryModel = require("./models/categoryModelMongoDb");
const notesModel = require("./models/notesModelMongoDb");
const projectModel = require("./models/projectModelMongoDb");
const storyboardModel = require("./models/storyboardModelMongoDb");
const tagsModel = require("./models/tagsModelMongoDb");
const tasklogModel = require("./models/tasklogModelMongoDb");
const usersModel = require("./models/userModelMongoDb");

categoryModel.initialize("GameOrganizerDB", true, url)
.then(notesModel.initialize("GameOrganizerDB", false, url))
.then(projectModel.initialize("GameOrganizerDB", false, url))
.then(storyboardModel.initialize("GameOrganizerDB", false, url))
.then(tagsModel.initialize("GameOrganizerDB", true, url))
.then(tasklogModel.initialize("GameOrganizerDB", false, url))
.then(usersModel.initialize("GameOrganizerDB", false, url))
.then(app.listen(port));