const express = require('express');
const router = express.Router();

// Any invalid input displays this page to the server
const routeRoot = '*';

/**
 * Handles any request of an invalid endpoint
 * @param {string} request 
 * @param {string} response error message displaying invalid request
 */
router.all(routeRoot, sendErrorResponse);
function sendErrorResponse(request, response) {
    response.sendStatus(404);
}

module.exports = {
    router,
    routeRoot
}
