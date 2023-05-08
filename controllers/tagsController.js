const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /tags to make database requests
const routeRoot = '/tag';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const tagModelMongoDb = require("../models/tagsModelMongoDb");
let requestJson;

/**
 * Validates reading an existing tag in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {integer} request parameter of name of the tag to get
 * @param {string} response result on whether or not the tag was successfully retrieved
 */
router.get('/:id', handleGetSingleTag);
async function handleGetSingleTag(request, response) {
    try {
        let tagObject = (await tagModelMongoDb.getTagSingle(request.params.id));
        if(tagObject != null) {
            logger.info("Tag controller | Tag ["+tagObject.id+"] was retrieved successfully!");
            response.status(200);
            response.send(tagObject);
        }
        else {
            logger.error("Tag controller | Failed to retrieve tag ["+request.params.id+"]");
            response.status(400);
            response.send("Tag controller | Failed to retrieve tag ["+request.params.id+"]");
        }
    }
    catch(err) {
        logger.error("Tag controller | Failed to get a single tag: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else if(err instanceof InvalidInputError) {
            response.status(400);
            response.send({errorMessage: "There was a validation error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}

/**
 * Validates reading all existing tags in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the tag to get
 * @param {string} response result on whether or not the tag was successfully retrieved
 */
router.get('/', handleGetAllTags);
async function handleGetAllTags(request, response) {
    try {
        let tagObject = (await tagModelMongoDb.getAllTag());
        if(tagObject != null) {
            logger.info("Tag controller | Retrieved successfully!");
            response.status(200);
            response.send(tagObject);
        }
        else {
            logger.error("Tag controller | Failed to retrieve all tags");
            response.status(400);
            response.send("Tag controller | Failed to retrieve all tags");
        }
    }
    catch(err) {
        logger.error("Tag controller | Failed to get all tags: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}


module.exports = {
    router,
    routeRoot
}
