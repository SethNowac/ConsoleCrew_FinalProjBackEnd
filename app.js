const express = require('express');
const app = express();

const logger = require('./logger')
const pinohttp = require('pino-http');
const httpLogger = pinohttp({logger: logger});
app.use(httpLogger)

const bodyParser = require("body-parser");
const cors = require("cors");

// names of each controller in the server
const controllers = ['homeController', 'gameOrganizerController', 'errorController']

app.use(cors());
app.use(express.json());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// Register routes from all controllers 
//  (Assumes a flat directory structure and common 
// 'routeRoot' / 'router' export)
controllers.forEach((controllerName) => {
    try {
        const controllerRoutes = require('./controllers/' + controllerName);
        app.use(controllerRoutes.routeRoot,
            controllerRoutes.router);
    } catch (error) {
        logger.error("App error: " + error.message);
        throw error; // We could fail gracefully, but this 
        //  would hide bugs later on.
    }
})

const listEndpoints = require('express-list-endpoints');
logger.info(listEndpoints(app));

module.exports = app