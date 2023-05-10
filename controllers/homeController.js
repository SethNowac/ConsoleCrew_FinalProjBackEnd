const express = require('express');
const { send } = require('express/lib/response');
const { authenticateUser, refreshSession } = require('./sessionController');
const logger = require('../logger');
const router = express.Router();

// Uses /home to make a request to the home page
const routeRoot = '/home';

/**
 * Sends a greeting response to the server upon entering the home page
 * @param {string} request 
 * @param {string} response A greeting to the user
 */
router.get('/', sendGreetingResponseToServer);
function sendGreetingResponseToServer(request, response) {
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    logger.info("User " + authenticatedSession.userSession.username + " is authorized for home page");

    refreshSession(request, response);
    response.send("Welcome to the home screen");
}

module.exports = {
    router,
    routeRoot
}
